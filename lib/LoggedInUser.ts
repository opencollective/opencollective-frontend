import { uniqBy } from 'lodash';

import { CollectiveType } from './constants/collectives';
import type { ReverseCompatibleMemberRole } from './constants/roles';
import type { GraphQLV1Collective } from './custom_typings/GraphQLV1';
import {
  type Account,
  type AccountWithParent,
  type CommentFieldsFragment,
  MemberRole,
  type Update,
} from './graphql/types/v2/graphql';
import type { PREVIEW_FEATURE_KEYS, PreviewFeature } from './preview-features';
import { previewFeatures } from './preview-features';

/** Common type for collective/account parameters that works with both v1 and v2 data */
export type CollectiveParam = {
  slug: string;
  type?: string;
  id?: string | number;
  parent?: { slug?: string; id?: string | number; policies?: Record<string, unknown> } | null;
  parentCollective?: { slug?: string; id?: string | number; policies?: Record<string, unknown> } | null;
  host?: { slug?: string; id?: string } | null;
  policies?: Record<string, unknown>;
};

/**
 * Represent the current logged in user. Includes methods to check permissions.
 * Accepts the v2 `loggedInAccount` (Individual) response directly.
 */
class LoggedInUser {
  private roles: Record<string, ReverseCompatibleMemberRole[]>;

  // v2 Individual fields (set via Object.assign in constructor)
  public id: string;
  public legacyId: number;
  public slug: string;
  public name: string;
  public legalName: string;
  public type: string;
  public imageUrl: string;
  public email: string;
  public isLimited: boolean;
  public isRoot: boolean;
  public hasSeenLatestChangelogEntry: boolean;
  public hasTwoFactorAuth: boolean;
  public hasPassword: boolean;
  public requiresProfileCompletion: boolean;
  public settings: Record<string, any>;
  public currency: string;
  public categories: string[];
  public location: { id?: string; address?: string; country?: string; structured?: any };

  // memberOf with v2 shape (account instead of collective, flat array extracted from nodes)
  public memberOf: Array<{
    id: string;
    role: ReverseCompatibleMemberRole;
    account: {
      id: string;
      legacyId: number;
      slug: string;
      type: string;
      name: string;
      imageUrl: string;
      isIncognito?: boolean;
      isHost?: boolean;
      isArchived?: boolean;
      hasHosting?: boolean;
      currency?: string;
      settings?: Record<string, any>;
      categories?: string[];
      policies?: Record<string, any>;
      parent?: { id: string; legacyId?: number; policies?: Record<string, any> };
      host?: { id: string };
      endsAt?: string;
      childrenAccounts?: { nodes: Array<Record<string, any>> };
      location?: { id?: string; address?: string; country?: string; structured?: any };
    };
  }>;

  constructor(data) {
    // The v2 response has memberOf as { nodes: [...] }. Flatten it before assigning.
    if (data?.memberOf?.nodes) {
      data = { ...data, memberOf: data.memberOf.nodes };
    }
    Object.assign(this, data);
    if (this.memberOf) {
      // Build a map of roles like { [accountSlug]: [ADMIN, BACKER...] }
      this.roles = this.memberOf.reduce((roles, member) => {
        if (member.account) {
          roles[member.account.slug] = roles[member.account.slug] || [];
          roles[member.account.slug].push(member.role);
        }

        return roles;
      }, {});
    }
  }

  /**
   * Constructs a v1-compatible collective object from this user's fields.
   * Only needed for components deeply entangled with v1 mutations/queries.
   */
  toV1Collective(): GraphQLV1Collective {
    return {
      id: this.legacyId,
      slug: this.slug,
      name: this.name,
      legalName: this.legalName,
      imageUrl: this.imageUrl,
      type: this.type as GraphQLV1Collective['type'],
      settings: this.settings,
      currency: this.currency,
      policies: undefined,
    };
  }

  /**
   * hasRole if LoggedInUser has one of the roles for the given collective
   */
  hasRole(roles: ReverseCompatibleMemberRole | ReverseCompatibleMemberRole[], collective: { slug?: string }) {
    if (!collective || !this.roles[collective.slug]) {
      return false;
    } else if (typeof roles === 'string') {
      return this.roles[collective.slug].includes(roles);
    } else if (Array.isArray(roles)) {
      return this.roles[collective.slug].some(role => roles.includes(role));
    }
  }

  /**
   * isAdminOfCollective if LoggedInUser is
   * - its own USER collective
   * - is admin of the collective
   * - is host of the collective
   */
  isAdminOfCollective(collective: CollectiveParam) {
    if (!collective) {
      return false;
    } else if (collective.type === CollectiveType.EVENT) {
      return this.canEditEvent(collective);
    } else if (collective.type === CollectiveType.PROJECT) {
      return this.canEditProject(collective);
    } else {
      return (
        (collective['id'] && collective['id'] === this.legacyId) ||
        collective.slug === this.slug ||
        this.hasRole(MemberRole.ADMIN, collective)
      );
    }
  }

  /**
   * isAdminOfCollectiveOrHost if LoggedInUser is
   * - its own USER collective
   * - is admin of the collective
   * - is host of the collective
   */
  isAdminOfCollectiveOrHost(collective: CollectiveParam) {
    if (!collective) {
      return false;
    } else if (this.isAdminOfCollective(collective)) {
      return true;
    } else {
      return this.hasRole([MemberRole.HOST, MemberRole.ADMIN], collective) || this.isHostAdmin(collective);
    }
  }

  /**
   * Has access to admin panel if admin or accountant
   */
  canSeeAdminPanel(collective: CollectiveParam) {
    return this.hasRole([MemberRole.ADMIN, MemberRole.ACCOUNTANT], collective);
  }

  /**
   * CanEditComment if LoggedInUser is
   * - creator of the comment
   * - is admin or host of the collective
   */
  canEditComment(comment: CommentFieldsFragment) {
    if (!comment) {
      return false;
    }

    return (
      this.hasRole([MemberRole.HOST, MemberRole.ADMIN, MemberRole.COMMUNITY_MANAGER], comment.account) ||
      this.isHostAdmin(comment.account) ||
      this.isSelf(comment.fromAccount) ||
      this.canEditEvent(comment.account)
    );
  }

  /**
   * Returns true if passed collective is the user collective
   */
  isSelf(collective: CollectiveParam) {
    if (!collective) {
      return false;
    } else if (typeof collective['id'] === 'number') {
      return collective['id'] === this.legacyId;
    } else {
      return collective.slug === this.slug;
    }
  }

  /**
   * CanEditEvent if LoggedInUser is
   * - admin of the event
   * - admin of the parent collective
   */
  canEditEvent(event: CollectiveParam) {
    if (!event) {
      return false;
    } else if (event.type !== CollectiveType.EVENT) {
      return false;
    }

    const parent = event['parentCollective'] || event['parent'];
    return this.hasRole(MemberRole.ADMIN, parent) || this.hasRole(MemberRole.ADMIN, event);
  }

  /**
   * CanEditProject if LoggedInUser is
   * - admin of the project
   * - admin of the parent collective
   */
  canEditProject(project: CollectiveParam) {
    if (!project) {
      return false;
    } else if (project.type !== CollectiveType.PROJECT) {
      return false;
    }

    const parent = project['parentCollective'] || project['parent'];
    return this.hasRole(MemberRole.ADMIN, parent) || this.hasRole(MemberRole.ADMIN, project);
  }

  /**
   * Returns true if user can edit this update
   */
  canEditUpdate(update: Update) {
    if (!update) {
      return false;
    } else if (this.isAdminOfCollectiveOrHost(update.fromAccount)) {
      return true; // if admin of collective author
    } else if (this.isAdminOfCollectiveOrHost(update.account)) {
      return true;
    } else if (this.hasRole([MemberRole.COMMUNITY_MANAGER], update.account)) {
      return true; // if community manager of the collective
    }
  }

  /**
   * List all the hosts this user belongs to and is admin of
   */
  hostsUserIsAdminOf() {
    const accounts = this.memberOf
      .filter(m => m.account?.isHost)
      .filter(m => this.hasRole(MemberRole.ADMIN, m.account))
      .map(m => m.account);

    return uniqBy(accounts, 'id');
  }

  isHostAdmin(collective: CollectiveParam) {
    if (!collective || !collective.host) {
      return false;
    } else {
      return this.hasRole(MemberRole.ADMIN, collective.host) || this.hasRole(MemberRole.HOST, collective);
    }
  }

  /**
   * Returns true if the logged in user is an accountant of the collective, and nothing else
   */
  isAccountantOnly(collective) {
    return !this.isAdminOfCollective(collective) && this.hasRole(MemberRole.ACCOUNTANT, collective);
  }

  /**
   * Returns true if the logged in user is a community manager of the collective, and nothing else
   */
  isCommunityManagerOnly(collective) {
    return !this.isAdminOfCollective(collective) && this.hasRole(MemberRole.COMMUNITY_MANAGER, collective);
  }

  hasPreviewFeatureEnabled(featureKey: PREVIEW_FEATURE_KEYS | `${PREVIEW_FEATURE_KEYS}`) {
    const { earlyAccess = {} } = this.settings || {};
    const feature = previewFeatures.find(f => f.key === featureKey);
    if (!feature) {
      // eslint-disable-next-line no-console
      console.warn(`Preview feature ${featureKey} not found`);
      return false;
    }

    if ('isEnabled' in feature && typeof feature.isEnabled === 'function') {
      return feature.isEnabled();
    }

    const enabledByDefault = Boolean(
      feature.enabledByDefaultFor?.some(
        slug => slug === '*' || this.hasRole([MemberRole.ADMIN, MemberRole.MEMBER], { slug }),
      ),
    );
    const isTurnedOn = earlyAccess[featureKey] === true;
    const isTurnedOff = earlyAccess[featureKey] === false;
    const isEnabledInEnv = !feature.env || (feature.env as string[]).includes(process.env.OC_ENV);
    const isEnabledByDevEnv =
      feature.alwaysEnableInDev &&
      (['development', 'staging'].includes(process.env.NODE_ENV) || ['e2e'].includes(process.env.OC_ENV));

    return (
      (isEnabledByDevEnv && !isTurnedOff) ||
      Boolean(isEnabledInEnv && (isTurnedOn || (enabledByDefault && !isTurnedOff)))
    );
  }

  getAvailablePreviewFeatures(): PreviewFeature[] {
    const { earlyAccess = {} } = this.settings || {};

    /**
     * Include preview features when
     * - they are in public beta
     * - the user have a saved setting for it
     * - the user is admin/member of an account that have closed beta access or feature enabled by default
     */
    const availablePreviewFeatures = previewFeatures.filter(feature => {
      const userHaveSetting = typeof earlyAccess[feature.key] !== 'undefined';
      const hasClosedBetaAccess = feature.closedBetaAccessFor?.some(
        slug => slug === this.slug || this.hasRole([MemberRole.ADMIN, MemberRole.MEMBER], { slug }),
      );
      const enabledByDefault = feature.enabledByDefaultFor?.some(
        slug => slug === '*' || this.hasRole([MemberRole.ADMIN, MemberRole.MEMBER], { slug }),
      );
      const isEnabledInEnv = !feature.env || (feature.env as string[]).includes(process.env.OC_ENV);
      const isEnabledByDevEnv =
        feature.alwaysEnableInDev &&
        (['development', 'staging'].includes(process.env.NODE_ENV) || ['e2e'].includes(process.env.OC_ENV));
      const hasAccess = feature.hasAccess?.(this);
      return (
        feature.hide?.(this) !== true &&
        (feature.isEnabled?.() || // Always show enabled custom features
          (isEnabledInEnv &&
            (isEnabledByDevEnv ||
              feature.publicBeta ||
              userHaveSetting ||
              hasClosedBetaAccess ||
              enabledByDefault ||
              hasAccess)))
      );
    });

    return availablePreviewFeatures;
  }

  shouldDisplaySetupGuide(account: { legacyId: number } | { id: number }) {
    if (!account || !this.settings) {
      return false;
    }

    return this.settings?.showSetupGuide?.[`id${'legacyId' in account ? account.legacyId : account.id}`];
  }
}

export default LoggedInUser;

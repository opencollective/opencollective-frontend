import { get, uniqBy } from 'lodash';

import { CollectiveType } from './constants/collectives';
import ROLES from './constants/roles';
import { previewFeatures } from './preview-features';

/**
 * Represent the current logged in user. Includes methods to check permissions.
 */
class LoggedInUser {
  constructor(data) {
    Object.assign(this, data);
    if (this.memberOf) {
      // Build a map of roles like { [collectiveSlug]: [ADMIN, BACKER...] }
      this.roles = this.memberOf.reduce((roles, member) => {
        if (member.collective) {
          roles[member.collective.slug] = roles[member.collective.slug] || [];
          roles[member.collective.slug].push(member.role);
        }

        return roles;
      }, {});
    }
  }
}

/**
 * hasRole if LoggedInUser has one of the roles for the given collective
 */
LoggedInUser.prototype.hasRole = function (roles, collective) {
  if (!collective || !this.roles[collective.slug]) {
    return false;
  } else if (typeof roles === 'string') {
    return this.roles[collective.slug].includes(roles);
  } else {
    return this.roles[collective.slug].some(role => roles.includes(role));
  }
};

/**
 * isAdminOfCollective if LoggedInUser is
 * - its own USER collective
 * - is admin of the collective
 * - is host of the collective
 */
LoggedInUser.prototype.isAdminOfCollective = function (collective) {
  if (!collective) {
    return false;
  } else if (collective.type === CollectiveType.EVENT) {
    return this.canEditEvent(collective);
  } else if (collective.type === CollectiveType.PROJECT) {
    return this.canEditProject(collective);
  } else {
    return (
      collective.id === this.CollectiveId ||
      collective.slug === get(this, 'collective.slug') ||
      this.hasRole(ROLES.ADMIN, collective)
    );
  }
};

/**
 * isAdminOfCollectiveOrHost if LoggedInUser is
 * - its own USER collective
 * - is admin of the collective
 * - is host of the collective
 */
LoggedInUser.prototype.isAdminOfCollectiveOrHost = function (collective) {
  if (!collective) {
    return false;
  } else if (this.isAdminOfCollective(collective)) {
    return true;
  } else {
    return this.hasRole([ROLES.HOST, ROLES.ADMIN], collective) || this.isHostAdmin(collective);
  }
};

/**
 * Has access to admin panel if admin or accountant
 */
LoggedInUser.prototype.canSeeAdminPanel = function (collective) {
  return this.hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT], collective);
};

/**
 * CanEditComment if LoggedInUser is
 * - creator of the comment
 * - is admin or host of the collective
 */
LoggedInUser.prototype.canEditComment = function (comment) {
  if (!comment) {
    return false;
  }

  return (
    this.hasRole([ROLES.HOST, ROLES.ADMIN], comment.account) ||
    this.isHostAdmin(comment.account) ||
    this.isSelf(comment.fromAccount) ||
    this.canEditEvent(comment.account)
  );
};

/**
 * Returns true if passed collective is the user collective
 */
LoggedInUser.prototype.isSelf = function (collective) {
  if (!collective || !collective.id) {
    return false;
  } else {
    return collective.id === this.CollectiveId || collective.slug === this.collective.slug;
  }
};

/**
 * CanEditEvent if LoggedInUser is
 * - admin of the event
 * - admin of the parent collective
 */
LoggedInUser.prototype.canEditEvent = function (event) {
  if (!event) {
    return false;
  } else if (event.type !== CollectiveType.EVENT) {
    return false;
  }

  const parent = event.parentCollective || event.parent;
  return this.hasRole(ROLES.ADMIN, parent) || this.hasRole(ROLES.ADMIN, event);
};

/**
 * CanEditProject if LoggedInUser is
 * - admin of the project
 * - admin of the parent collective
 */
LoggedInUser.prototype.canEditProject = function (project) {
  if (!project) {
    return false;
  } else if (project.type !== CollectiveType.PROJECT) {
    return false;
  }

  const parent = project.parentCollective || project.parent;
  return this.hasRole(ROLES.ADMIN, parent) || this.hasRole(ROLES.ADMIN, project);
};

/**
 * Returns true if user can edit this update
 */
LoggedInUser.prototype.canEditUpdate = function (update) {
  if (!update) {
    return false;
  } else if (this.isAdminOfCollectiveOrHost(update.fromAccount)) {
    return true; // if admin of collective author
  } else if (this.isAdminOfCollectiveOrHost(update.account)) {
    return true;
  }
};

/**
 * List all the hosts this user belongs to and is admin of
 */
LoggedInUser.prototype.hostsUserIsAdminOf = function () {
  const collectives = this.memberOf
    .filter(m => m.collective.isHost)
    .filter(m => this.hasRole(ROLES.ADMIN, m.collective))
    .map(m => m.collective);

  return uniqBy(collectives, 'id');
};

LoggedInUser.prototype.isHostAdmin = function (collective) {
  if (!collective || !collective.host) {
    return false;
  } else {
    return this.hasRole(ROLES.ADMIN, collective.host) || this.hasRole(ROLES.HOST, collective);
  }
};

/**
 * Returns true if the logged in user is an accountant of the collective, and nothing else
 */
LoggedInUser.prototype.isAccountantOnly = function (collective) {
  return !this.isAdminOfCollective(collective) && this.hasRole(ROLES.ACCOUNTANT, collective);
};

LoggedInUser.prototype.hasPreviewFeatureEnabled = function (featureKey) {
  const { earlyAccess = {} } = this.collective.settings;
  const feature = previewFeatures.find(f => f.key === featureKey);
  if (!feature) {
    // eslint-disable-next-line no-console
    console.warn(`Preview feature ${featureKey} not found`);
    return false;
  }

  const enabledByDefault = feature.enabledByDefaultFor?.some(
    slug => slug === '*' || this.hasRole([ROLES.ADMIN, ROLES.MEMBER], { slug }),
  );
  const isTurnedOn = earlyAccess[featureKey] === true;
  const isTurnedOff = earlyAccess[featureKey] === false;
  const isEnabledInEnv = !feature.env || feature.env.includes(process.env.OC_ENV);

  return Boolean(isEnabledInEnv && (isTurnedOn || (enabledByDefault && !isTurnedOff)));
};

LoggedInUser.prototype.getAvailablePreviewFeatures = function () {
  const { earlyAccess = {} } = this.collective.settings;

  /**
   * Include preview features when
   * - they are in public beta
   * - the user have a saved setting for it
   * - the user is admin/member of an account that have closed beta access or feature enabled by default
   */
  const availablePreviewFeatures = previewFeatures.filter(feature => {
    const userHaveSetting = typeof earlyAccess[feature.key] !== 'undefined';
    const hasClosedBetaAccess = feature.closedBetaAccessFor?.some(slug =>
      this.hasRole([ROLES.ADMIN, ROLES.MEMBER], { slug }),
    );
    const enabledByDefault = feature.enabledByDefaultFor?.some(
      slug => slug === '*' || this.hasRole([ROLES.ADMIN, ROLES.MEMBER], { slug }),
    );
    const isEnabledInEnv = !feature.env || feature.env.includes(process.env.OC_ENV);
    const isEnabledByDevEnv = feature.alwaysEnableInDev && ['development', 'staging'].includes(process.env.NODE_ENV);
    return (
      isEnabledInEnv &&
      (isEnabledByDevEnv || feature.publicBeta || userHaveSetting || hasClosedBetaAccess || enabledByDefault)
    );
  });

  return availablePreviewFeatures;
};

export default LoggedInUser;

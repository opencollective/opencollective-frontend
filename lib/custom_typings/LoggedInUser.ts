import { PREVIEW_FEATURE_KEYS, PreviewFeature } from '../preview-features';

export type LoggedInUser = {
  id: number;
  collective: {
    id: number;
    slug: string;
    name: string;
    legalName: string;
    type: string;
  };
  memberOf: Array<{
    id: number;
    role: string;
    collective: {
      id: number;
      slug: string;
      name: string;
      type: string;
      imageUrl: string;
      isArchived: boolean;
      isIncognito: boolean;
    };
  }>;
  hasTwoFactorAuth: boolean;
  hasRole: (roles: string[] | string, collective) => boolean;
  hostsUserisAdminOf: () => any[];
  isAdminOfCollective: (collective: any) => boolean;
  isAdminOfCollectiveOrHost: (collective: any) => boolean;
  isHostAdmin: (collective: any) => boolean;
  isAccountantOnly: (collective: any) => boolean;
  isSelf: (collective: any) => boolean;
  isRoot: boolean;
  canEditComment: (comment: any) => boolean;
  canEditEvent: (event: any) => boolean;
  canEditProject: (project: any) => boolean;
  canEditUpdate: (update: any) => boolean;
  canSeeAdminPanel: (collective: any) => boolean;
  email: string;
  hasPreviewFeatureEnabled: (featureKey: PREVIEW_FEATURE_KEYS | `${PREVIEW_FEATURE_KEYS}`) => boolean;
  getAvailablePreviewFeatures: () => PreviewFeature[];
};

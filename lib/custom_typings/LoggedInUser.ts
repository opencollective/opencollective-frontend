import { PREVIEW_FEATURE_KEYS, PreviewFeature } from '../preview-features';

type GraphQLV1Collective = Partial<{
  id: number;
  slug: string;
  name: string;
  type: string;
  imageUrl: string;
  isArchived: boolean;
  isIncognito: boolean;
  children: GraphQLV1Collective[];
}>;

export type LoggedInUser = {
  id: number;
  collective: GraphQLV1Collective;
  memberOf: Array<{
    id: number;
    role: string;
    collective: GraphQLV1Collective;
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

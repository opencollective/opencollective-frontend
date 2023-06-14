/**
 * A map of keys used for preview features.
 */
export const PREVIEW_FEATURE_KEYS = {
  DASHBOARD: 'dashboard',
};

/**
 * Members and admins of these accounts will see Closed Beta preview features in the Preview Features modal.
 */
export const closedBetaAccessAccounts: string[] = ['opencollective', 'opensource', 'foundation', 'europe'];

export type PreviewFeature = { key: string; title: string; description: string; publicBeta: boolean };

/**
 * List of current preview features. Setting `publicBeta` to `true` will make the feature available to toggle for all users.
 */
export const previewFeatures: PreviewFeature[] = [
  {
    key: PREVIEW_FEATURE_KEYS.DASHBOARD,
    title: 'Workspace',
    description: 'Introducing improved navigation and a central admin dashboard for all accounts.',
    publicBeta: false,
  },
];

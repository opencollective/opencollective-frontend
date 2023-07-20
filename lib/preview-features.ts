/**
 * A map of keys used for preview features.
 */
export const PREVIEW_FEATURE_KEYS = {
  DASHBOARD: 'dashboard',
  EXPENSE_PIPELINE: 'EXPENSE_PIPELINE',
};

export type PreviewFeature = {
  key: string;
  title: string;
  description: string;
  publicBeta: boolean; // If true, the feature will be available to toggle for all users.
  closedBetaAccessFor?: string[]; // Account slugs. Members and admins of these accounts will see this feature as a Closed Beta preview in the Preview Features modal.
  enabledByDefaultFor?: string[]; // Account slugs. Members and admins of these accounts will have the feature enabled by default.
};

/**
 * List of current preview features.
 */
export const previewFeatures: PreviewFeature[] = [
  {
    key: PREVIEW_FEATURE_KEYS.DASHBOARD,
    title: 'Workspace',
    description: 'Introducing improved navigation and a central admin dashboard for all accounts.',
    publicBeta: false,
    closedBetaAccessFor: ['opencollective', 'opensource', 'foundation', 'europe', 'design', 'engineering'],
    enabledByDefaultFor: ['opencollective'],
  },
  {
    key: PREVIEW_FEATURE_KEYS.EXPENSE_PIPELINE,
    title: 'Host Expense Pipeline',
    description: 'Introducing tabs in the host expenses dashboard to help you manage paying expenses.',
    publicBeta: false,
    closedBetaAccessFor: ['opencollective', 'opensource', 'foundation', 'europe', 'design', 'engineering'],
  },
];

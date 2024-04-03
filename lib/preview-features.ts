/**
 * A map of keys used for preview features.
 */
export enum PREVIEW_FEATURE_KEYS {
  DYNAMIC_TOP_BAR = 'DYNAMIC_TOP_BAR',
  COLLECTIVE_OVERVIEW = 'COLLECTIVE_OVERVIEW',
  NEW_EXPENSE_FLOW = 'NEW_EXPENSE_FLOW',
  HOST_REPORTS = 'HOST_REPORTS',
}

export type PreviewFeature = {
  key: PREVIEW_FEATURE_KEYS | `${PREVIEW_FEATURE_KEYS}`;
  title: string;
  description?: string;
  publicBeta: boolean; // If true, the feature will be available to toggle for all users.
  closedBetaAccessFor?: string[]; // Account slugs. Members and admins of these accounts will see this feature as a Closed Beta preview in the Preview Features modal.
  enabledByDefaultFor?: ('*' | string)[]; // Account slugs. Members and admins of these accounts will have the feature enabled by default.
  env?: Array<'development' | 'test' | 'e2e' | 'staging' | 'production'>; // If set, the feature will be available only in the specified environments.
  alwaysEnableInDev?: boolean; // If true, the feature will be enabled by default in development.
  dependsOn?: PREVIEW_FEATURE_KEYS;
};

/**
 * List of current preview features.
 */
export const previewFeatures: PreviewFeature[] = [
  {
    key: PREVIEW_FEATURE_KEYS.DYNAMIC_TOP_BAR,
    title: 'Dynamic top bar',
    publicBeta: false,
  },
  {
    key: PREVIEW_FEATURE_KEYS.COLLECTIVE_OVERVIEW,
    title: 'Collective Overview',
    description: 'Overview page for Collectives in Dashboard',
    publicBeta: true,
    alwaysEnableInDev: true,
    enabledByDefaultFor: ['*'],
    closedBetaAccessFor: ['opencollective', 'opensource', 'foundation', 'europe', 'design', 'engineering'],
  },
  {
    key: PREVIEW_FEATURE_KEYS.NEW_EXPENSE_FLOW,
    title: 'New expense submission flow',
    description: 'Improved expense submission flow in Dashboard',
    alwaysEnableInDev: true,
    publicBeta: false,
    closedBetaAccessFor: ['opencollective', 'design', 'engineering'],
  },
  {
    key: PREVIEW_FEATURE_KEYS.HOST_REPORTS,
    title: 'New Host Transactions Report',
    description:
      'A new report that sums up all transactions to create a comprehensive overview of all activity, both for managed funds and operational funds.',
    publicBeta: false,
    alwaysEnableInDev: true,
    closedBetaAccessFor: ['opencollective', 'opensource', 'europe', 'design', 'engineering', 'giftcollective'],
  },
];

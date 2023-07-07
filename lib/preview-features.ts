/**
 * A map of keys used for preview features.
 */
export const PREVIEW_FEATURE_KEYS = {
  DASHBOARD: 'dashboard',
  ACCOUNT_SWITCHER_IN_TOP_BAR: 'ACCOUNT_SWITCHER_IN_TOP_BAR',
  DASHBOARD_TOP_BAR: 'DASHBOARD_TOP_BAR',
  DASHBOARD_COLLECTIVE_OVERVIEW: 'DASHBOARD_COLLECTIVE_OVERVIEW',
  DASHBOARD_REMOVE_SITE_MENU: 'DASHBOARD_REMOVE_SITE_MENU',
  DASHBOARD_REMOVE_LEGACY_COLLECTIVE_LIST: 'DASHBOARD_REMOVE_LEGACY_COLLECTIVE_LIST',
  DASHBOARD_ACCOUNT_OVERVIEW: 'DASHBOARD_ACCOUNT_OVERVIEW',
};

export type PreviewFeatureType = {
  key: string;
  title: string;
  description?: string;
  publicBeta?: boolean; // If true, the feature will be available to toggle for all users.
  closedBetaAccessFor?: string[]; // Account slugs. Members and admins of these accounts will see this feature as a Closed Beta preview in the Preview Features modal.
  enabledByDefaultFor?: string[]; // Account slugs. Members and admins of these accounts will have the feature enabled by default.
  subFeatures?: PreviewFeatureType[]; // Sub-features that are part of this feature.
};

/**
 * List of current preview features.
 */
export const previewFeatures: PreviewFeatureType[] = [
  {
    key: PREVIEW_FEATURE_KEYS.DASHBOARD,
    title: 'New navigation & dashboard',
    description: 'Introducing improved navigation and a central admin dashboard for all accounts.',
    publicBeta: true,
    closedBetaAccessFor: ['opencollective', 'opensource', 'foundation', 'europe', 'design', 'engineering'],
    enabledByDefaultFor: ['opencollective'],
    subFeatures: [
      {
        key: PREVIEW_FEATURE_KEYS.ACCOUNT_SWITCHER_IN_TOP_BAR,
        title: 'Account Switcher in Top Bar',
        subFeatures: [
          {
            key: PREVIEW_FEATURE_KEYS.DASHBOARD_TOP_BAR,
            title: 'Dashboard Navigation under Top Bar',
          },
        ],
      },
      {
        key: PREVIEW_FEATURE_KEYS.DASHBOARD_ACCOUNT_OVERVIEW,
        title: 'Collective Links in Overview',
      },
      {
        key: PREVIEW_FEATURE_KEYS.DASHBOARD_REMOVE_LEGACY_COLLECTIVE_LIST,
        title: 'Remove legacy Collective list in profile menu',
      },
      {
        key: PREVIEW_FEATURE_KEYS.DASHBOARD_REMOVE_SITE_MENU,
        title: 'Remove Hamburger Site Menu',
      },
      {
        key: PREVIEW_FEATURE_KEYS.DASHBOARD_COLLECTIVE_OVERVIEW,
        title: 'Add "Overview" for all accounts',
      },
    ],
  },
];

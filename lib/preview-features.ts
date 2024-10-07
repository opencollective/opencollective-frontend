import type LoggedInUser from './LoggedInUser';

/**
 * A map of keys used for preview features.
 */
export enum PREVIEW_FEATURE_KEYS {
  DYNAMIC_TOP_BAR = 'DYNAMIC_TOP_BAR',
  COLLECTIVE_OVERVIEW = 'COLLECTIVE_OVERVIEW',
  NEW_EXPENSE_FLOW = 'NEW_EXPENSE_FLOW',
  HOST_REPORTS = 'HOST_REPORTS',
  CROWDFUNDING_REDESIGN = 'CROWDFUNDING_REDESIGN',
  TRANSACTIONS_IMPORTS = 'TRANSACTIONS_IMPORTS',
  AUTHENTICATED_SSR = 'AUTHENTICATED_SSR',
  VERCEL_BACKEND = 'VERCEL_BACKEND',
  KEYBOARD_SHORTCUTS = 'KEYBOARD_SHORTCUTS',
  SEARCH_COMMAND = 'SEARCH_COMMAND',
}

type Environment = 'development' | 'test' | 'e2e' | 'staging' | 'production';

export type PreviewFeature = {
  key: PREVIEW_FEATURE_KEYS | `${PREVIEW_FEATURE_KEYS}`;
  title: string;
  description?: string;
  publicBeta: boolean; // If true, the feature will be available to toggle for all users.
  closedBetaAccessFor?: string[]; // Account slugs. Members and admins of these accounts will see this feature as a Closed Beta preview in the Preview Features modal.
  enabledByDefaultFor?: ('*' | string)[]; // Account slugs. Members and admins of these accounts will have the feature enabled by default.
  env?: Array<Environment>; // If set, the feature will be available only in the specified environments.
  alwaysEnableInDev?: boolean; // If true, the feature will be enabled by default in development.
  dependsOn?: PREVIEW_FEATURE_KEYS;
  setIsEnabled?: (enable: boolean) => void;
  isEnabled?: () => boolean;
  hasAccess?: (loggedInUser: LoggedInUser, env: Environment) => boolean;
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
    closedBetaAccessFor: ['opencollective', 'design', 'engineering', 'opensource', 'europe'],
  },
  {
    key: PREVIEW_FEATURE_KEYS.HOST_REPORTS,
    title: 'New Host Transactions Report',
    description:
      'A new report that sums up all transactions to create a comprehensive overview of all activity in your account.',
    publicBeta: true,
    alwaysEnableInDev: true,
  },
  {
    key: PREVIEW_FEATURE_KEYS.CROWDFUNDING_REDESIGN,
    title: 'Crowdfunding Redesign',
    description:
      'Be part of the crowdfunding redesign effort and get access to previews of new crowdfunding and profile pages',
    alwaysEnableInDev: true,
    publicBeta: true,
    closedBetaAccessFor: ['opencollective', 'design', 'engineering'],
  },
  {
    key: PREVIEW_FEATURE_KEYS.TRANSACTIONS_IMPORTS,
    title: 'Transactions Imports',
    description: 'A new tool to import batches of transactions.',
    publicBeta: true,
  },
  {
    key: PREVIEW_FEATURE_KEYS.AUTHENTICATED_SSR,
    title: 'Authenticated SSR',
    description: 'Uses cookie based authentication to generate initial page loads on the server',
    closedBetaAccessFor: ['opencollective', 'design', 'engineering'],
    publicBeta: false,
    isEnabled() {
      return document.cookie.indexOf('enableAuthSsr') !== -1;
    },
    setIsEnabled(enabled) {
      if (!enabled) {
        document.cookie = 'enableAuthSsr=; Path=/; Max-Age=0';
      } else {
        document.cookie = 'enableAuthSsr=1; Path=/; Max-Age=9999999';
      }
    },
  },
  {
    key: PREVIEW_FEATURE_KEYS.VERCEL_BACKEND,
    title: 'Vercel Backend',
    description: 'Uses Vercel as the frontend backend provider',
    closedBetaAccessFor: ['opencollective', 'design', 'engineering'],
    publicBeta: false,
    isEnabled() {
      return document.cookie.indexOf('backend=vercel') !== -1;
    },
    setIsEnabled(enabled) {
      if (!enabled) {
        document.cookie = 'backend=; Path=/; Max-Age=0';
      } else {
        document.cookie = 'backend=vercel; Path=/; Max-Age=9999999';
      }
    },
  },
  {
    key: PREVIEW_FEATURE_KEYS.KEYBOARD_SHORTCUTS,
    title: 'Keyboard Shortcuts',
    description: 'Use keyboard shortcuts to navigate the expense flow',
    publicBeta: true,
  },
  {
    key: PREVIEW_FEATURE_KEYS.SEARCH_COMMAND,
    publicBeta: false,
    title: 'Search command menu',
    description: 'Global search powered by ElasticSearch',
    hasAccess: (user, env) => env === 'development' || user?.isRoot,
  },
];

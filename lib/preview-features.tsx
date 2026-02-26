import React from 'react';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import I18nFormatters, { getI18nLink } from '@/components/I18nFormatters';
import { Kbd } from '@/components/ui/Kbd';

import type LoggedInUser from './LoggedInUser';

/**
 * A map of keys used for preview features.
 */
export enum PREVIEW_FEATURE_KEYS {
  NEW_EXPENSE_FLOW = 'NEW_EXPENSE_FLOW',
  INLINE_EDIT_EXPENSE = 'INLINE_EDIT_EXPENSE',
  CROWDFUNDING_REDESIGN = 'CROWDFUNDING_REDESIGN',
  AUTHENTICATED_SSR = 'AUTHENTICATED_SSR',
  VERCEL_BACKEND = 'VERCEL_BACKEND',
  KEYBOARD_SHORTCUTS = 'KEYBOARD_SHORTCUTS',
  SEARCH_COMMAND = 'SEARCH_COMMAND',
  SEARCH_RESULTS_PAGE = 'SEARCH_RESULTS_PAGE',
  PLATFORM_BILLING = 'PLATFORM_BILLING',
  SIDEBAR_REORG_DISBURSEMENTS = 'SIDEBAR_REORG_DISBURSEMENTS',
  ASYNC_EXPORTS = 'ASYNC_EXPORTS',
  TABLE_QUICK_ACTIONS = 'TABLE_QUICK_ACTIONS',
}

enum Categories {
  HOSTING = 'Hosting',
  GENERAL = 'General Platform',
  FOR_NERDS = 'For Nerds',
}

export type PreviewFeature = {
  key: PREVIEW_FEATURE_KEYS | `${PREVIEW_FEATURE_KEYS}`;
  title: React.ReactNode;
  category: Categories;
  description?: React.ReactNode;
  publicBeta: boolean; // If true, the feature will be available to toggle for all users.
  closedBetaAccessFor?: string[]; // Account slugs. Members and admins of these accounts will see this feature as a Closed Beta preview in the Preview Features modal.
  enabledByDefaultFor?: ('*' | string)[]; // Account slugs. Members and admins of these accounts will have the feature enabled by default.
  env?: Array<'development' | 'test' | 'e2e' | 'staging' | 'production'>; // If set, the feature will be available only in the specified environments.
  alwaysEnableInDev?: boolean; // If true, the feature will be enabled by default in development.
  dependsOn?: PREVIEW_FEATURE_KEYS;
  setIsEnabled?: (enable: boolean) => void;
  isEnabled?: () => boolean;
  hasAccess?: (loggedInUser: LoggedInUser) => boolean;
  hide?: (loggedInUser: LoggedInUser) => boolean;
};

const PLATFORM_ACCOUNTS = ['ofico', 'ofitech'];
const ENGINEERS = ['znarf', 'betree', 'leokewitz', 'henrique-silva', 'gustavlrsn', 'sudharaka-palamakumbura'];
export const OFICO_MEMBER_ORGANIZATIONS = [
  'europe',
  'giftcollective',
  'oce-foundation-eur',
  'oce-foundation-usd',
  'opencollective',
  'opensource',
  'raft',
  'the-social-change-nest-eu',
  'the-social-change-nest',
  // TODO: Remove after new pricing is fully launched
  'metagov',
];

/**
 * List of current preview features.
 */
export const previewFeatures: PreviewFeature[] = [
  {
    key: PREVIEW_FEATURE_KEYS.CROWDFUNDING_REDESIGN,
    title: <FormattedMessage defaultMessage="Crowdfunding Redesign" id="uVYlI0" />,
    description: (
      <FormattedMessage
        defaultMessage="Be part of the <strong>crowdfunding redesign effort</strong> and get access to previews of new crowdfunding and profile pages. Experience enhanced profile pages with separate fundraising and storytelling views, clearer relationships between collectives and their projects, improved goal tracking, and better collective narratives that showcase your impact and long-term sustainability.{newLine}{newLine}Check out the <blogPostLink>blog post</blogPostLink> for more details."
        id="PreviewFeatures.crowdfundingRedesignDescription"
        values={{
          ...I18nFormatters,
          blogPostLink: getI18nLink({ href: 'https://blog.opencollective.com/open-collective-crowdfunding-redesign/' }),
        }}
      />
    ),
    alwaysEnableInDev: true,
    publicBeta: true,
    category: Categories.GENERAL,
  },
  {
    key: PREVIEW_FEATURE_KEYS.PLATFORM_BILLING,
    title: 'Platform billing',
    description: 'New platform billing dashboard',
    alwaysEnableInDev: true,
    publicBeta: false,
    closedBetaAccessFor: [...PLATFORM_ACCOUNTS, ...OFICO_MEMBER_ORGANIZATIONS],
    category: Categories.GENERAL,
  },
  {
    key: PREVIEW_FEATURE_KEYS.KEYBOARD_SHORTCUTS,
    title: <FormattedMessage defaultMessage="Keyboard Shortcuts" id="PreviewFeatures.keyboardShortcutsTitle" />,
    description: (
      <React.Fragment>
        <p>
          <FormattedMessage
            defaultMessage="Navigate the expense flow more efficiently with keyboard shortcuts. Speed up your workflow and reduce mouse dependency for common actions."
            id="PreviewFeatures.keyboardShortcutsDescription"
          />
        </p>
        <p className="mt-2">
          <FormattedMessage defaultMessage="On Expenses dashboard: " id="Bmw33p" />
          <ul className="mt-2 ml-4">
            <li>
              <FormattedMessage
                defaultMessage="{key} to select the next Expense."
                id="PreviewFeatures.keyboardShortcutsExpenseListNext"
                values={{ key: <Kbd>J</Kbd> }}
              />
            </li>
            <li>
              <FormattedMessage
                defaultMessage="{key} to select the previous Expense."
                id="PreviewFeatures.keyboardShortcutsExpenseListPrev"
                values={{ key: <Kbd>K</Kbd> }}
              />
            </li>
            <li>
              <FormattedMessage
                defaultMessage="{key} to Pay selected Expense (if ready to pay)."
                id="PreviewFeatures.keyboardShortcutsExpenseListPay"
                values={{ key: <Kbd>P</Kbd> }}
              />
            </li>
            <li>
              <FormattedMessage
                defaultMessage="{key} to check Security alerts for selected Expense."
                id="PreviewFeatures.keyboardShortcutsExpenseListSecurity"
                values={{ key: <Kbd>S</Kbd> }}
              />
            </li>
            <li>
              <FormattedMessage
                defaultMessage="{key} to open Expense details."
                id="PreviewFeatures.keyboardShortcutsExpenseListOpen"
                values={{ key: <Kbd>Enter</Kbd> }}
              />
            </li>
          </ul>
        </p>
        <p className="mt-2">
          <FormattedMessage defaultMessage="On Expenses details: " id="UDjr0F" />
          <ul className="mt-2 ml-4">
            <li>
              <FormattedMessage
                defaultMessage="{leftKey} and {rightKey} to navigate through attachments."
                id="PreviewFeatures.keyboardShortcutsExpenseDetailsAttachments"
                values={{ leftKey: <Kbd>&larr;</Kbd>, rightKey: <Kbd>&rarr;</Kbd> }}
              />
            </li>
            <li>
              <FormattedMessage
                defaultMessage="{key} to put selected Expense on Hold."
                id="PreviewFeatures.keyboardShortcutsExpenseListHold"
                values={{ key: <Kbd>H</Kbd> }}
              />
            </li>
            <li>
              <FormattedMessage
                defaultMessage="{key} to mark selected Expense as Incomplete."
                id="PreviewFeatures.keyboardShortcutsExpenseListIncomplete"
                values={{ key: <Kbd>I</Kbd> }}
              />
            </li>
            <li>
              <FormattedMessage
                defaultMessage="{key} to Pay selected Expense (if ready to pay)."
                id="PreviewFeatures.keyboardShortcutsExpenseListPay"
                values={{ key: <Kbd>P</Kbd> }}
              />
            </li>
            <li>
              <FormattedMessage
                defaultMessage="{key} to enter Edit mode."
                id="PreviewFeatures.keyboardShortcutsExpenseDetailsEdit"
                values={{ key: <Kbd>E</Kbd> }}
              />
            </li>
            <li>
              <FormattedMessage
                defaultMessage="{key} to close Expense details."
                id="PreviewFeatures.keyboardShortcutsExpenseDetailsClose"
                values={{ key: <Kbd>Esc</Kbd> }}
              />
            </li>
          </ul>
        </p>
      </React.Fragment>
    ),
    publicBeta: true,
    category: Categories.GENERAL,
  },
  {
    key: PREVIEW_FEATURE_KEYS.NEW_EXPENSE_FLOW,
    title: <FormattedMessage defaultMessage="New Expense Submission Flow" id="PreviewFeatures.newExpenseFlowTitle" />,
    description: (
      <FormattedMessage
        defaultMessage="Experience an improved expense submission flow in the Dashboard with better user experience, clearer navigation, and enhanced form validation."
        id="PreviewFeatures.newExpenseFlowDescription"
      />
    ),
    category: Categories.GENERAL,
    publicBeta: false,
    enabledByDefaultFor: ['*'],
    // Hide if not root and not manually enabled
    hide: (loggedInUser: LoggedInUser) =>
      !loggedInUser.isRoot &&
      !get(loggedInUser, `collective.settings.earlyAccess.${PREVIEW_FEATURE_KEYS.NEW_EXPENSE_FLOW}`),
  },
  {
    key: PREVIEW_FEATURE_KEYS.INLINE_EDIT_EXPENSE,
    title: <FormattedMessage defaultMessage="Inline Expense Editing" id="PreviewFeatures.inlineEditExpenseTitle" />,
    description: (
      <FormattedMessage
        defaultMessage="Edit expense details directly in the Dashboard without navigating to separate pages."
        id="PreviewFeatures.inlineEditExpenseDescription"
      />
    ),
    category: Categories.GENERAL,
    publicBeta: true,
    enabledByDefaultFor: ['*'],
  },
  {
    key: PREVIEW_FEATURE_KEYS.SEARCH_COMMAND,
    title: <FormattedMessage defaultMessage="Search Command Menu" id="PreviewFeatures.searchCommandTitle" />,
    description: (
      <FormattedMessage
        defaultMessage="Discover a new way to search for collectives, transactions, expenses, and more through an intuitive command menu interface. Access information faster with powerful search capabilities."
        id="PreviewFeatures.searchCommandDescription"
      />
    ),
    alwaysEnableInDev: true,
    publicBeta: false,
    closedBetaAccessFor: [...PLATFORM_ACCOUNTS, ...OFICO_MEMBER_ORGANIZATIONS],
    category: Categories.GENERAL,
  },
  {
    key: PREVIEW_FEATURE_KEYS.SEARCH_RESULTS_PAGE,
    title: <FormattedMessage defaultMessage="Search Results Page" id="PreviewFeatures.searchResultsPage" />,
    alwaysEnableInDev: false,
    publicBeta: false,
    closedBetaAccessFor: [...PLATFORM_ACCOUNTS],
    category: Categories.GENERAL,
  },
  {
    key: PREVIEW_FEATURE_KEYS.AUTHENTICATED_SSR,
    title: 'Authenticated SSR',
    description: 'Uses cookie based authentication to generate initial page loads on the server.',
    closedBetaAccessFor: ENGINEERS,
    publicBeta: false,
    isEnabled() {
      return typeof document !== 'undefined' && document.cookie.indexOf('enableAuthSsr') !== -1;
    },
    setIsEnabled(enabled) {
      if (typeof document === 'undefined') {
        return;
      }
      if (!enabled) {
        document.cookie = 'enableAuthSsr=; Path=/; Max-Age=0';
      } else {
        document.cookie = 'enableAuthSsr=1; Path=/; Max-Age=9999999';
      }
    },
    category: Categories.FOR_NERDS,
  },
  {
    key: PREVIEW_FEATURE_KEYS.VERCEL_BACKEND,
    title: 'Vercel Backend',
    description: 'Uses Vercel as the frontend backend provider.',
    publicBeta: false,
    closedBetaAccessFor: ENGINEERS,
    isEnabled() {
      return typeof document !== 'undefined' && document.cookie.indexOf('backend=vercel') !== -1;
    },
    setIsEnabled(enabled) {
      if (typeof document === 'undefined') {
        return;
      }
      if (!enabled) {
        document.cookie = 'backend=; Path=/; Max-Age=0';
      } else {
        document.cookie = 'backend=vercel; Path=/; Max-Age=9999999';
      }
    },
    category: Categories.FOR_NERDS,
  },
  {
    key: PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS,
    title: 'Sidebar Reorganization Disbursements',
    description: 'Reorganization of the "Expenses" section in the Host Dashboard',
    publicBeta: true,
    closedBetaAccessFor: [...PLATFORM_ACCOUNTS, ...OFICO_MEMBER_ORGANIZATIONS],
    category: Categories.HOSTING,
    enabledByDefaultFor: ['*'],
  },
  {
    key: PREVIEW_FEATURE_KEYS.ASYNC_EXPORTS,
    title: <FormattedMessage defaultMessage="Async Exports" id="PreviewFeatures.asyncExportsTitle" />,
    description: (
      <FormattedMessage
        defaultMessage="Enable background processing for large data exports. Exports will be processed asynchronously and you'll be notified when they're ready to download."
        id="PreviewFeatures.asyncExportsDescription"
      />
    ),
    publicBeta: false,
    closedBetaAccessFor: [...PLATFORM_ACCOUNTS, ...OFICO_MEMBER_ORGANIZATIONS],
    category: Categories.HOSTING,
  },
  {
    key: PREVIEW_FEATURE_KEYS.TABLE_QUICK_ACTIONS,
    title: <FormattedMessage defaultMessage="Table Quick Actions" id="PreviewFeatures.tableQuickActionsTitle" />,
    description: (
      <FormattedMessage
        defaultMessage="Enable quick action buttons that appear on table rows when you hover over them. Perform common actions faster without opening the dropdown menu."
        id="PreviewFeatures.tableQuickActionsDescription"
      />
    ),
    publicBeta: true,
    alwaysEnableInDev: true,
    category: Categories.GENERAL,
  },
];

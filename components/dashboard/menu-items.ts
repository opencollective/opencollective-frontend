import { isUndefined } from 'lodash';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightLeft,
  Award,
  BarChart2,
  BookOpenCheck,
  BookUserIcon,
  Building,
  CreditCard,
  FileText,
  HandCoins,
  HeartHandshake,
  IdCard,
  LayoutDashboard,
  Megaphone,
  Receipt,
  Search,
  Settings,
  Signature,
  Store,
  Ticket,
  Users,
  Users2,
  UserStar,
  UserX,
  Wallet,
} from 'lucide-react';
import type { IntlShape } from 'react-intl';

import hasFeature, { FEATURES, isFeatureEnabled, isFeatureSupported } from '../../lib/allowed-features';
import { hasAccountMoneyManagement, isIndividualAccount, isOrganizationAccount } from '../../lib/collective';
import { isOneOfTypes, isType } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';
import { LegalDocumentType } from '../../lib/graphql/types/v2/graphql';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';
import type { WorkspaceAccount } from '@/lib/LoggedInUser';
import type LoggedInUser from '@/lib/LoggedInUser';
import { isOrganization as isOrgWorkspace } from '@/lib/LoggedInUser';

import { ALL_SECTIONS, ROOT_SECTIONS, SECTION_LABELS } from './constants';

const { USER, ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT, INDIVIDUAL } = CollectiveType;

export type PageMenuItem = {
  type?: 'page';
  Icon?: LucideIcon;
  label?: string;
  section: string;
  if?: boolean;
};
type GroupMenuItem = {
  type: 'group';
  label: string;
  Icon: LucideIcon;
  subMenu: PageMenuItem[];
  if?: boolean;
};

const ROOT_MENU = [
  {
    type: 'group',
    label: 'Accounts',
    Icon: Users,
    subMenu: [
      { label: 'Search Accounts', section: ROOT_SECTIONS.ALL_COLLECTIVES },
      { label: 'Connect Accounts', section: ROOT_SECTIONS.CONNECT_ACCOUNTS },
      { label: 'Merge Accounts', section: ROOT_SECTIONS.MERGE_ACCOUNTS },
      { label: 'Unhost Account', section: ROOT_SECTIONS.UNHOST_ACCOUNTS },
      { label: 'Account Settings', section: ROOT_SECTIONS.ACCOUNT_SETTINGS },
      { label: 'Account Type', section: ROOT_SECTIONS.ACCOUNT_TYPE },
      { label: 'Anonymize Account', section: ROOT_SECTIONS.ANONYMIZE_ACCOUNT },
      { label: 'Recurring Contributions', section: ROOT_SECTIONS.RECURRING_CONTRIBUTIONS },
      { label: 'Activity Log', section: ALL_SECTIONS.ACTIVITY_LOG },
      { label: 'Clear Cache', section: ROOT_SECTIONS.CLEAR_CACHE },
    ],
  },
  {
    type: 'group',
    label: 'Subscriptions',
    Icon: HandCoins,
    subMenu: [
      { label: 'Manage Subscriptions', section: ROOT_SECTIONS.SUBSCRIBERS },
      { label: 'Legacy Subscribers', section: ROOT_SECTIONS.LEGACY_SUBSCRIBERS },
    ],
  },
  {
    type: 'group',
    label: 'Ledger',
    Icon: BookOpenCheck,
    subMenu: [
      { label: 'Search Transactions', section: ALL_SECTIONS.HOST_TRANSACTIONS },
      { label: 'Move Authored Contributions', section: ROOT_SECTIONS.MOVE_AUTHORED_CONTRIBUTIONS },
      { label: 'Move Received Contributions', section: ROOT_SECTIONS.MOVE_RECEIVED_CONTRIBUTIONS },
      { label: 'Move Expenses', section: ROOT_SECTIONS.MOVE_EXPENSES },
    ],
  },
  {
    type: 'group',
    label: 'Moderation',
    Icon: UserX,
    subMenu: [
      { label: 'Search & Ban', section: ROOT_SECTIONS.SEARCH_AND_BAN },
      { label: 'Ban Account', section: ROOT_SECTIONS.BAN_ACCOUNTS },
    ],
  },
] as GroupMenuItem[];

type MenuItem = PageMenuItem | GroupMenuItem;

function shouldIncludeMenuItemWithLegacyFallback(
  account: WorkspaceAccount,
  featureKey: (typeof FEATURES)[keyof typeof FEATURES],
  fallback: boolean,
) {
  return 'platformSubscription' in account && account.platformSubscription
    ? isFeatureSupported(account, featureKey)
    : fallback;
}

export const getMenuItems = ({
  intl,
  account,
  LoggedInUser,
  isRootDashboard,
}: {
  intl: IntlShape;
  account: WorkspaceAccount;
  LoggedInUser: LoggedInUser;
  isRootDashboard: boolean;
}): MenuItem[] => {
  if (isRootDashboard) {
    return ROOT_MENU;
  }
  if (!account) {
    return null;
  }

  const isIndividual = isIndividualAccount(account);
  const isOrganization = isOrganizationAccount(account);
  const isAccountantOnly = LoggedInUser?.isAccountantOnly(account);
  const isCommunityManagerOnly = LoggedInUser?.isCommunityManagerOnly(account);
  const hasMoneyManagement = hasAccountMoneyManagement(account);
  const hasHosting = 'hasHosting' in account && account.hasHosting;
  const isSimpleIndividual = isIndividual && !hasHosting;
  const isSimpleOrganization = isOrganization && !hasMoneyManagement;
  const isHostedType = isOneOfTypes(account, [COLLECTIVE, FUND, EVENT, PROJECT]);

  const hasPlatformBillingEnabled = Boolean(
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.PLATFORM_BILLING) ||
    ('platformSubscription' in account && account.platformSubscription),
  );

  const hasIssuedGrantRequests = true; // account.issuedGrantRequests?.totalCount > 0;
  const hasReceivedGrantRequests = true; // account.receivedGrantRequests?.totalCount > 0;
  const showReceivedGrantRequests =
    hasReceivedGrantRequests || (!isIndividual && !hasMoneyManagement && hasFeature(account, FEATURES.RECEIVE_GRANTS));

  const items: MenuItem[] = [
    {
      section: ALL_SECTIONS.OVERVIEW,
      Icon: LayoutDashboard,
      if: !isAccountantOnly,
    },
    {
      section: ALL_SECTIONS.SEARCH,
      Icon: Search,
      label: intl.formatMessage({ id: 'Search', defaultMessage: 'Search' }),
      if: LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SEARCH_RESULTS_PAGE),
    },
    {
      if:
        (isOneOfTypes(account, [COLLECTIVE, FUND]) || (isOrganization && hasMoneyManagement)) &&
        !isCommunityManagerOnly,
      section: ALL_SECTIONS.ACCOUNTS,
      Icon: Wallet,
      label: intl.formatMessage({ defaultMessage: 'Accounts', id: 'FvanT6' }),
    },
    {
      if: (isSimpleIndividual || isSimpleOrganization) && !isCommunityManagerOnly,
      section: ALL_SECTIONS.SUBMITTED_EXPENSES,
      Icon: Receipt,
      label: intl.formatMessage({ id: 'Expenses', defaultMessage: 'Expenses' }),
    },
    {
      if: !isSimpleIndividual && !isSimpleOrganization && !isCommunityManagerOnly,
      type: 'group',
      label: intl.formatMessage({ id: 'Expenses', defaultMessage: 'Expenses' }),
      Icon: Receipt,
      subMenu: [
        {
          if: hasHosting && !LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS),
          section: ALL_SECTIONS.HOST_EXPENSES,
          label: intl.formatMessage({ id: 'ToCollectives', defaultMessage: 'To Collectives' }),
        },
        {
          if: hasHosting && LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS),
          section: ALL_SECTIONS.PAY_DISBURSEMENTS,
          label: intl.formatMessage({ defaultMessage: 'Pay Disbursements', id: 'El6h63' }),
        },
        {
          section: ALL_SECTIONS.PAID_DISBURSEMENTS,
          if: hasHosting && LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS),
          label: intl.formatMessage({
            defaultMessage: 'Paid Disbursements',
            id: 'rwMrEx',
          }),
        },
        {
          if: hasHosting && LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS),
          section: ALL_SECTIONS.APPROVE_PAYMENT_REQUESTS,
          label: intl.formatMessage({ defaultMessage: 'Approve Payment Requests', id: 'ApprovePaymentRequests' }),
        },
        {
          if: hasHosting && LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS),
          section: ALL_SECTIONS.HOST_PAYMENT_REQUESTS,
          label: intl.formatMessage({ defaultMessage: 'All Payment Requests', id: 'HostPaymentRequests' }),
        },
        {
          if: !isIndividual && !LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS),
          section: ALL_SECTIONS.EXPENSES,
          label: intl.formatMessage(
            {
              id: 'hZhgoW',
              defaultMessage: 'To {accountName}',
            },
            { accountName: account.name },
          ),
        },
        {
          if:
            !isIndividual &&
            !hasHosting &&
            LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS),
          section: ALL_SECTIONS.PAYMENT_REQUESTS,
          label: intl.formatMessage({ defaultMessage: 'Payment Requests', id: 'PaymentRequests' }),
        },
        {
          section: ALL_SECTIONS.SUBMITTED_EXPENSES,
          label: intl.formatMessage(
            {
              id: 'PVqJoO',
              defaultMessage: 'From {accountName}',
            },
            { accountName: account.name },
          ),
        },
      ],
    },
    {
      if: isIndividual && hasIssuedGrantRequests,
      Icon: Award,
      label: intl.formatMessage({ defaultMessage: 'Grant Requests', id: 'fng2Fr' }),
      section: ALL_SECTIONS.SUBMITTED_GRANTS,
    },
    {
      if: !isIndividual,
      type: 'group',
      Icon: Award,
      label: hasMoneyManagement
        ? intl.formatMessage({ defaultMessage: 'Funds & Grants', id: 'cjQcnL' })
        : intl.formatMessage({ defaultMessage: 'Grants', id: 'Csh2rX' }),
      subMenu: [
        {
          if: hasHosting,
          section: ALL_SECTIONS.HOSTED_FUNDS,
        },
        {
          if: hasHosting,
          section: ALL_SECTIONS.HOSTED_GRANTS,
          label: intl.formatMessage({ defaultMessage: 'Hosted Grant Requests', id: 'Bt/+M7' }),
        },
        {
          if: showReceivedGrantRequests,
          section: ALL_SECTIONS.GRANTS,
        },
        {
          if: showReceivedGrantRequests,
          section: ALL_SECTIONS.APPROVE_GRANT_REQUESTS,
        },
        {
          // Issued grants visible when there is history
          if: hasIssuedGrantRequests,
          section: ALL_SECTIONS.SUBMITTED_GRANTS,
        },
      ],
    },
    {
      if: !isIndividual && isHostedType && !isCommunityManagerOnly,
      section: ALL_SECTIONS.CONTRIBUTORS,
      label: intl.formatMessage({ id: 'Contributors', defaultMessage: 'Contributors' }),
      Icon: BookUserIcon,
    },
    {
      if: (isSimpleIndividual || isSimpleOrganization) && !isCommunityManagerOnly,
      section: ALL_SECTIONS.OUTGOING_CONTRIBUTIONS,
      label: intl.formatMessage({ id: 'Contributions', defaultMessage: 'Contributions' }),
      Icon: HandCoins,
    },
    {
      if: !isSimpleIndividual && !isSimpleOrganization && !isCommunityManagerOnly,
      type: 'group',
      label: intl.formatMessage({ id: 'Contributions', defaultMessage: 'Contributions' }),
      Icon: HandCoins,
      subMenu: [
        {
          if: !isIndividual,
          label: intl.formatMessage({ defaultMessage: 'Incoming Contributions', id: 'IncomingContributions' }),
          section: ALL_SECTIONS.INCOMING_CONTRIBUTIONS,
        },
        {
          if: !isIndividual && hasMoneyManagement && !isCommunityManagerOnly,
          label: intl.formatMessage({ defaultMessage: 'Expected Funds', id: 'ExpectedFunds' }),
          section: ALL_SECTIONS.HOST_EXPECTED_FUNDS,
        },
        {
          if: !isIndividual && hasMoneyManagement && !isCommunityManagerOnly,
          label: intl.formatMessage({ defaultMessage: 'Incomplete Contributions', id: 'IncompleteContributions' }),
          section: ALL_SECTIONS.INCOMPLETE_CONTRIBUTIONS,
        },
        {
          label: intl.formatMessage(
            {
              id: 'PVqJoO',
              defaultMessage: 'From {accountName}',
            },
            { accountName: account.name },
          ),
          section: ALL_SECTIONS.OUTGOING_CONTRIBUTIONS,
        },
      ],
    },
    {
      if: hasHosting && !isAccountantOnly && !isCommunityManagerOnly,
      type: 'group',
      Icon: Building,
      label: intl.formatMessage({ defaultMessage: 'Hosting', id: 'DkzeEN' }),
      subMenu: [
        {
          section: ALL_SECTIONS.HOSTED_COLLECTIVES,
        },
        {
          label: intl.formatMessage({ id: 'HostApplications.Applications', defaultMessage: 'Applications' }),
          section: ALL_SECTIONS.HOST_APPLICATIONS,
        },
      ],
    },
    {
      section: ALL_SECTIONS.HOST_AGREEMENTS,
      if: shouldIncludeMenuItemWithLegacyFallback(account, FEATURES.AGREEMENTS, hasHosting && !isIndividual),
      Icon: Signature,
      label: intl.formatMessage({ id: 'Agreements', defaultMessage: 'Agreements' }),
    },
    {
      if: hasMoneyManagement && !isAccountantOnly && !isCommunityManagerOnly,
      section: ALL_SECTIONS.VENDORS,
      Icon: Store,
    },
    {
      if: !isIndividual && hasMoneyManagement,
      label: intl.formatMessage({ id: 'People', defaultMessage: 'People' }),
      section: ALL_SECTIONS.PEOPLE,
      Icon: Users2,
    },
    {
      if: hasMoneyManagement && isFeatureEnabled(account, FEATURES.KYC),
      label: 'KYC',
      Icon: IdCard,
      type: 'group',
      subMenu: [
        {
          section: ALL_SECTIONS.KYC,
          label: intl.formatMessage({ defaultMessage: 'Requests', id: 'VirtualCards.Requests' }),
        },
      ],
    },
    {
      section: ALL_SECTIONS.HOST_TAX_FORMS,
      Icon: FileText,
      label: intl.formatMessage({ defaultMessage: 'Tax Forms', id: 'skSw4d' }),
      if: shouldIncludeMenuItemWithLegacyFallback(
        account,
        FEATURES.TAX_FORMS,
        hasMoneyManagement &&
          Boolean(
            isOrgWorkspace(account) && account.host?.requiredLegalDocuments?.includes(LegalDocumentType.US_TAX_FORM),
          ),
      ),
    },
    {
      if:
        hasMoneyManagement &&
        isOrganization && //
        hasFeature(account, FEATURES.VIRTUAL_CARDS) &&
        !isAccountantOnly &&
        !isCommunityManagerOnly,
      type: 'group',
      label: intl.formatMessage({ id: 'VirtualCards.Title', defaultMessage: 'Virtual Cards' }),
      Icon: CreditCard,
      subMenu: [
        {
          label: intl.formatMessage({ id: 'VirtualCards.Issued', defaultMessage: 'Issued' }),
          section: ALL_SECTIONS.HOST_VIRTUAL_CARDS,
        },
        {
          label: intl.formatMessage({ id: 'VirtualCards.Requests', defaultMessage: 'Requests' }),
          section: ALL_SECTIONS.HOST_VIRTUAL_CARD_REQUESTS,
        },
      ],
    },
    {
      if: hasHosting && !isCommunityManagerOnly,
      type: 'group',
      label: intl.formatMessage({ id: 'Reports', defaultMessage: 'Reports' }),
      Icon: BarChart2,
      subMenu: [
        {
          section: ALL_SECTIONS.TRANSACTION_REPORTS,
          label: intl.formatMessage({ defaultMessage: 'Transactions', id: 'menu.transactions' }),
        },
        {
          section: ALL_SECTIONS.EXPENSE_REPORTS,
          label: intl.formatMessage({ defaultMessage: 'Expenses', id: 'Expenses' }),
        },
        {
          section: ALL_SECTIONS.CONTRIBUTIONS_REPORTS,
          label: intl.formatMessage({ defaultMessage: 'Contributions', id: 'Contributions' }),
        },
      ],
    },
    {
      if: !hasHosting && (isHostedType || hasMoneyManagement) && !isCommunityManagerOnly,
      label: intl.formatMessage({ id: 'Reports', defaultMessage: 'Reports' }),
      Icon: BarChart2,
      section: ALL_SECTIONS.TRANSACTION_REPORTS,
    },

    {
      if: isType(account, EVENT) && !isCommunityManagerOnly,
      section: ALL_SECTIONS.TICKETS,
      label: intl.formatMessage({ defaultMessage: 'Ticket tiers', id: 'tG3saB' }),
      Icon: Ticket,
    },
    {
      if: isType(account, EVENT) && !isCommunityManagerOnly,
      section: ALL_SECTIONS.TIERS,
      label: intl.formatMessage({ defaultMessage: 'Sponsorship tiers', id: '3Qx5eX' }),
      Icon: HeartHandshake,
    },
    {
      if: !hasMoneyManagement && !isCommunityManagerOnly,
      section: ALL_SECTIONS.TRANSACTIONS,
      Icon: ArrowRightLeft,
    },
    {
      if: hasMoneyManagement && !isCommunityManagerOnly,
      type: 'group',
      label: intl.formatMessage({ defaultMessage: 'Ledger', id: 'scwekL' }),
      Icon: ArrowRightLeft,
      subMenu: [
        {
          section: hasHosting ? ALL_SECTIONS.HOST_TRANSACTIONS : ALL_SECTIONS.TRANSACTIONS,
          label: intl.formatMessage({ id: 'menu.transactions', defaultMessage: 'Transactions' }),
        },
        {
          section: ALL_SECTIONS.OFF_PLATFORM_TRANSACTIONS,
          label: intl.formatMessage({ defaultMessage: 'Bank Account Sync', id: 'nVcwjv' }),
          if: shouldIncludeMenuItemWithLegacyFallback(
            account,
            FEATURES.OFF_PLATFORM_TRANSACTIONS,
            isFeatureEnabled(account, FEATURES.OFF_PLATFORM_TRANSACTIONS),
          ),
        },
        {
          section: ALL_SECTIONS.LEDGER_CSV_IMPORTS,
          label: intl.formatMessage({ defaultMessage: 'CSV Imports', id: 'd3jA/o' }),
          if: shouldIncludeMenuItemWithLegacyFallback(
            account,
            FEATURES.OFF_PLATFORM_TRANSACTIONS,
            isFeatureEnabled(account, FEATURES.OFF_PLATFORM_TRANSACTIONS),
          ),
        },
      ],
    },
    {
      if: !isIndividual,
      section: ALL_SECTIONS.UPDATES,
      Icon: Megaphone,
    },
    {
      if:
        !isOneOfTypes(account, [EVENT, USER]) &&
        (!isOrganization || hasMoneyManagement) &&
        !isAccountantOnly &&
        !isCommunityManagerOnly,
      section: ALL_SECTIONS.TIERS,
      Icon: HeartHandshake,
    },
    {
      if: !isIndividual && !isAccountantOnly && !isCommunityManagerOnly,
      section: ALL_SECTIONS.TEAM,
      Icon: UserStar,
    },
    {
      if:
        isHostedType &&
        hasFeature('host' in account && account.host, FEATURES.VIRTUAL_CARDS) &&
        'isApproved' in account &&
        account.isApproved &&
        !isCommunityManagerOnly,
      section: ALL_SECTIONS.VIRTUAL_CARDS,
      Icon: CreditCard,
    },
    {
      if: !isCommunityManagerOnly,
      type: 'group',
      label: intl.formatMessage({ id: 'Settings', defaultMessage: 'Settings' }),
      Icon: Settings,
      subMenu: [
        // General
        {
          section: ALL_SECTIONS.INFO,
          if: !isAccountantOnly,
        },
        {
          section: ALL_SECTIONS.TAX_INFORMATION,
          if: !isAccountantOnly,
        },
        {
          section: ALL_SECTIONS.COLLECTIVE_PAGE,
          if: !isAccountantOnly,
        },
        // Host sections
        ...(hasMoneyManagement
          ? [
              {
                section: ALL_SECTIONS.PLATFORM_SUBSCRIPTION,
                label: intl.formatMessage({ defaultMessage: 'Platform Billing', id: 'beRXFK' }),
                if: !isIndividual && hasPlatformBillingEnabled,
              },
              {
                section: ALL_SECTIONS.FISCAL_HOSTING,
                if: !isAccountantOnly && hasHosting,
              },
              {
                section: ALL_SECTIONS.POLICIES,
                if: isOneOfTypes(account, [USER, ORGANIZATION, COLLECTIVE]) && !isAccountantOnly,
              },
              {
                section: ALL_SECTIONS.RECEIVING_MONEY,
                if: !isAccountantOnly,
              },
              {
                section: ALL_SECTIONS.SENDING_MONEY,
                if: !isAccountantOnly,
              },
              {
                section: ALL_SECTIONS.OFF_PLATFORM_CONNECTIONS,
                if:
                  !isAccountantOnly &&
                  shouldIncludeMenuItemWithLegacyFallback(
                    account,
                    FEATURES.OFF_PLATFORM_TRANSACTIONS,
                    isFeatureEnabled(account, FEATURES.OFF_PLATFORM_TRANSACTIONS),
                  ),
              },
              {
                section: ALL_SECTIONS.CHART_OF_ACCOUNTS,
              },
              {
                section: ALL_SECTIONS.INVOICES_RECEIPTS,
                if: !isAccountantOnly,
              },
              {
                section: ALL_SECTIONS.HOST_VIRTUAL_CARDS_SETTINGS,
                if: hasFeature(account, FEATURES.VIRTUAL_CARDS) && isOrganization && !isAccountantOnly,
              },
            ]
          : []),
        // Security
        {
          section: ALL_SECTIONS.SECURITY,
          if: isOneOfTypes(account, [COLLECTIVE, FUND, ORGANIZATION]) && !isAccountantOnly,
        },
        {
          section: ALL_SECTIONS.USER_SECURITY,
          if: isIndividualAccount(account),
        },
        {
          section: ALL_SECTIONS.ACTIVITY_LOG,
          if: !isAccountantOnly,
        },
        // Payments / Payouts
        {
          section: ALL_SECTIONS.PAYMENT_METHODS,
          if: ['ACTIVE', 'AVAILABLE'].includes(account.features.USE_PAYMENT_METHODS) && !isAccountantOnly,
        },
        {
          section: ALL_SECTIONS.PAYMENT_RECEIPTS,
          if: isOneOfTypes(account, [INDIVIDUAL, USER, ORGANIZATION]),
        },
        {
          section: ALL_SECTIONS.GIFT_CARDS,
          if: ['ACTIVE', 'AVAILABLE'].includes(account.features.EMIT_GIFT_CARDS) && !isAccountantOnly,
        },
        // Sections for individual accounts
        {
          section: ALL_SECTIONS.NOTIFICATIONS,
          if: isIndividualAccount(account),
        },
        {
          section: ALL_SECTIONS.AUTHORIZED_APPS,
          if: isIndividualAccount(account),
        },
        // Collective sections
        {
          section: ALL_SECTIONS.HOST,
          if: isOneOfTypes(account, [COLLECTIVE, FUND]) && !isAccountantOnly,
        },
        {
          section: ALL_SECTIONS.COLLECTIVE_GOALS,
          if:
            !isAccountantOnly &&
            (!isUndefined(account.settings?.collectivePage?.showGoals) ||
              isOneOfTypes(account, [COLLECTIVE, PROJECT]) ||
              (isOrganization && hasMoneyManagement && !hasHosting)),
        },
        {
          // POLICIES also available for Fiscal hosts further up in this list
          section: ALL_SECTIONS.POLICIES,
          if: isOneOfTypes(account, [COLLECTIVE, FUND]) && !hasMoneyManagement && !isAccountantOnly,
        },
        {
          section: ALL_SECTIONS.CUSTOM_EMAIL,
          if: isOneOfTypes(account, [COLLECTIVE, EVENT, PROJECT]) && !isAccountantOnly,
        },
        {
          section: ALL_SECTIONS.WIDGETS,
          if: isOneOfTypes(account, [COLLECTIVE, PROJECT, FUND]) && !isAccountantOnly,
        },
        {
          section: ALL_SECTIONS.EXPORTS,
          if:
            isOneOfTypes(account, [ORGANIZATION]) &&
            hasMoneyManagement &&
            LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.ASYNC_EXPORTS),
        },
        {
          section: ALL_SECTIONS.FOR_DEVELOPERS,
          if: isOneOfTypes(account, [COLLECTIVE, USER, INDIVIDUAL, ORGANIZATION]) && !isAccountantOnly,
        },
        {
          section: ALL_SECTIONS.WEBHOOKS,
          if: !isAccountantOnly,
        },
        {
          section: ALL_SECTIONS.ADVANCED,
          if: !isAccountantOnly,
        },
      ],
    },
  ];

  return (
    items
      // filter root items
      .filter(item => ('if' in item ? Boolean(item['if']) : true))
      // filter subMenu items and add labels where missing
      .map(item => {
        if (item.type === 'group') {
          return {
            ...item,
            subMenu: item.subMenu
              .filter(item => ('if' in item ? Boolean(item['if']) : true))
              .map(item => ({ ...item, label: item.label || intl.formatMessage(SECTION_LABELS[item.section]) })),
          };
        }
        return { ...item, label: item.label || intl.formatMessage(SECTION_LABELS[item.section]) };
      })
  );
};

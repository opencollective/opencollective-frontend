import * as React from 'react';
import {
  ArrowRightLeft,
  BarChart2,
  BookUserIcon,
  Building,
  Building2,
  ChevronDown,
  Clock,
  Coins,
  CreditCard,
  Ellipsis,
  FileText,
  HandCoins,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Network,
  Pin,
  PinOff,
  Receipt,
  Rows3,
  Search,
  Settings,
  Signature,
  Store,
  Telescope,
  Ticket,
  Users2,
  Vault,
  Wallet,
  X,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { defineMessages, useIntl, type IntlShape } from 'react-intl';

import hasFeature, { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import { isChildAccount, isHostAccount, isIndividualAccount, isSelfHostedAccount } from '@/lib/collective';
import { isOneOfTypes, isType } from '@/lib/collective-sections';
import { CollectiveType } from '@/lib/constants/collectives';
import { type DashboardQuery, ExpenseType } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import type LoggedInUserType from '@/lib/LoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';
import { getDashboardRoute } from '@/lib/url-helpers';

import Link from '../Link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/Collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '../ui/Sidebar';
import { useWorkspace } from '../WorkspaceProvider';

import { ALL_SECTIONS, SECTION_LABELS } from './constants';
import { type MenuItem, type PageMenuItem, ROOT_MENU, shouldIncludeMenuItemWithLegacyFallback } from './getMenuItems';
import type { MenuSections } from './Menu';
import AccountSwitcher from './NewAccountSwitcher';
import AdminPanelSideBar from './SideBar';
import { type DashboardSettings, SidebarOrganization } from './SidebarSettingsPanel';
import { DashboardContext } from './DashboardContext';
const { USER, ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT, INDIVIDUAL } = CollectiveType;

const messages = defineMessages({
  pinToShortcuts: { id: 'dashboard.shortcuts.pin', defaultMessage: 'Pin to Shortcuts' },
  unpinFromShortcuts: { id: 'dashboard.shortcuts.unpin', defaultMessage: 'Unpin from Shortcuts' },
});

type AppSidebarProps = {
  menuItems: MenuItem[];
  isLoading: boolean;
  useLegacy?: boolean;
  prototypeSettings?: DashboardSettings;
  variant?: 'inset' | 'sidebar' | 'floating';
};

const filterAndLabel = (items, intl) =>
  items
    // filter root items
    .filter(item => item.if !== false)
    // filter subMenu items and add labels where missing
    .map(item => {
      if (item.type === 'group') {
        return {
          ...item,
          subMenu: item.subMenu
            .filter(item => item.if !== false)
            .map(item => ({ ...item, label: item.label || intl.formatMessage(SECTION_LABELS[item.section]) })),
        };
      }
      return { ...item, label: item.label || intl.formatMessage(SECTION_LABELS[item.section]) };
    });

export const getMenuItems = ({
  intl,
  account,
  LoggedInUser,
  prototype,
}: {
  intl: IntlShape;
  account: DashboardQuery['account'] | null | undefined;
  LoggedInUser: LoggedInUserType;
  prototype: DashboardSettings;
}): MenuSections => {
  if (!account) {
    return { main: [] };
  }
  const isRootProfile = account.type === 'ROOT' && LoggedInUser?.isRoot;
  if (isRootProfile) {
    return ROOT_MENU;
  }

  const isIndividual = isIndividualAccount(account);
  const isHost = isHostAccount(account);
  const isSelfHosted = isSelfHostedAccount(account);
  const isAccountantOnly = LoggedInUser?.isAccountantOnly(account);
  const isCommunityManagerOnly = LoggedInUser?.isCommunityManagerOnly(account);
  const isActive = account.isActive;
  const isActiveHost = isHost && isActive;
  const isChild = isChildAccount(account);
  const canHostAccounts = account.settings?.canHostAccounts !== false && isHost;

  const hasPlatformBillingEnabled =
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.PLATFORM_BILLING) || account.platformSubscription;
  const hasIssuedGrantRequests = account.issuedGrantRequests?.totalCount > 0;
  const hasReceivedGrantRequests = account.receivedGrantRequests?.totalCount > 0;
  const showReceivedGrantRequests =
    hasReceivedGrantRequests ||
    (!isIndividual &&
      !(isHost || isSelfHosted) &&
      Boolean(account.supportedExpenseTypes?.includes?.(ExpenseType.GRANT)));

  const settingsMenu: PageMenuItem[] = [
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
    ...(isHost || isSelfHosted
      ? [
          {
            section: ALL_SECTIONS.PLATFORM_SUBSCRIPTION,
            label: intl.formatMessage({ defaultMessage: 'Platform Billing', id: 'beRXFK' }),
            if: hasPlatformBillingEnabled,
          },
          {
            section: ALL_SECTIONS.FISCAL_HOSTING,
            if: !isAccountantOnly && !isSelfHosted && canHostAccounts,
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
            if: hasFeature(account, FEATURES.VIRTUAL_CARDS) && !isAccountantOnly && !isSelfHosted,
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
      if: isOneOfTypes(account, [COLLECTIVE, PROJECT]) && !isAccountantOnly,
    },
    {
      // POLICIES also available for Fiscal hosts further up in this list
      section: ALL_SECTIONS.POLICIES,
      if: isOneOfTypes(account, [COLLECTIVE, FUND]) && !isHost && !isSelfHosted && !isAccountantOnly,
    },
    {
      section: ALL_SECTIONS.CUSTOM_EMAIL,
      if: isOneOfTypes(account, [COLLECTIVE, EVENT, PROJECT]) && !isAccountantOnly,
    },
    {
      section: ALL_SECTIONS.EXPORT,
      if: isOneOfTypes(account, [COLLECTIVE, PROJECT, FUND]),
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
  ];

  if (prototype.sidebarOrganization === SidebarOrganization.GROUPING && isHost) {
    return {
      main: filterAndLabel(
        [
          {
            section: ALL_SECTIONS.OVERVIEW,
            Icon: Home,
            if: !isAccountantOnly,
          },
          {
            if: canHostAccounts,
            section: ALL_SECTIONS.HOST_EXPENSES,
            label: 'Expenses',
            Icon: Receipt,
          },
          {
            if: (isHost && canHostAccounts) || isSelfHosted,
            label: 'Contributions',
            section: ALL_SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS,
            Icon: HandCoins,
          },
          {
            if:
              (isHost || isSelfHosted) && LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.PEOPLE_DASHBOARD),
            label: intl.formatMessage({ id: 'People', defaultMessage: 'People' }),
            section: ALL_SECTIONS.PEOPLE,
            Icon: Users2,
          },
          {
            section: ALL_SECTIONS.INFO,
            Icon: Settings,
            label: 'Settings',
            // type: 'group',
            // subMenu: settingsMenu,
          },
        ] as MenuItem[],
        intl,
      ),
      tools: filterAndLabel(
        [
          {
            type: 'group',
            label: 'Hosting',
            Icon: Network,
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
            type: 'group',
            label: 'Funds & Grants',
            Icon: Vault,
            subMenu: [
              {
                if: isHost && canHostAccounts,
                section: ALL_SECTIONS.HOSTED_FUNDS,
              },
              {
                if: isHost || isSelfHosted,
                section: ALL_SECTIONS.HOSTED_GRANTS,
                label: intl.formatMessage({ defaultMessage: 'Grant Requests', id: 'fng2Fr' }),
              },
            ],
          },
          {
            type: 'group',
            label: 'Reporting',
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
            ],
          },
          {
            type: 'group',
            label: 'Organization',
            Icon: Building2,
            subMenu: [
              {
                section: ALL_SECTIONS.ACCOUNTS,
                label: intl.formatMessage({ defaultMessage: 'Accounts', id: 'FvanT6' }),
              },
              {
                section: ALL_SECTIONS.EXPENSES,
                label: intl.formatMessage(
                  {
                    defaultMessage: 'Expenses',
                    id: 'k2VBcF',
                  },
                  { accountName: account.name },
                ),
              },
              {
                if: !isIndividual && !isCommunityManagerOnly,
                section: ALL_SECTIONS.CONTRIBUTORS,
                label: intl.formatMessage({ id: 'Contributors', defaultMessage: 'Contributors' }),
              },
            ],
          },
          {
            type: 'group',
            label: 'Ledger',
            Icon: Rows3,
            subMenu: [
              {
                section: ALL_SECTIONS.HOST_TRANSACTIONS,
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
            type: 'group',
            label: 'More',
            Icon: Ellipsis,
            subMenu: [
              {
                section: ALL_SECTIONS.HOST_TAX_FORMS,
                label: intl.formatMessage({ defaultMessage: 'Tax Forms', id: 'skSw4d' }),
                if: shouldIncludeMenuItemWithLegacyFallback(
                  account,
                  FEATURES.TAX_FORMS,
                  isHost && Boolean(account.host?.requiredLegalDocuments?.includes('US_TAX_FORM')),
                ),
              },
              {
                section: ALL_SECTIONS.CHART_OF_ACCOUNTS,
              },
              {
                if: (isHost || isSelfHosted) && !isAccountantOnly && !isCommunityManagerOnly,
                section: ALL_SECTIONS.VENDORS,
              },
              {
                label: 'Virtual Cards',
                section: ALL_SECTIONS.HOST_VIRTUAL_CARDS,
              },
              {
                section: ALL_SECTIONS.HOST_AGREEMENTS,
                if: shouldIncludeMenuItemWithLegacyFallback(account, FEATURES.AGREEMENTS, isHost && canHostAccounts),
                label: intl.formatMessage({ id: 'Agreements', defaultMessage: 'Agreements' }),
              },
            ],
          },
        ] as MenuItem[],
        intl,
      ),
    };
  }

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
      if: isIndividual,
      section: ALL_SECTIONS.SUBMITTED_EXPENSES,
      Icon: Receipt,
      label: intl.formatMessage({ id: 'Expenses', defaultMessage: 'Expenses' }),
    },
    {
      if: !isIndividual && !isChild && !isCommunityManagerOnly,
      section: ALL_SECTIONS.ACCOUNTS,
      Icon: Wallet,
      label: intl.formatMessage({ defaultMessage: 'Accounts', id: 'FvanT6' }),
    },
    {
      if: !isIndividual && !isCommunityManagerOnly,
      type: 'group',
      label:
        prototype.pitchedSolutionsProgress >= 6
          ? 'Outgoing Money'
          : intl.formatMessage({ id: 'Expenses', defaultMessage: 'Expenses' }),
      Icon: Receipt,
      subMenu: [
        {
          if: prototype.pitchedSolutionsProgress >= 4,
          label: 'Disbursed Money',
          section: 'disbursed-money',
        },
        {
          if: isHost && canHostAccounts,
          section: ALL_SECTIONS.HOST_EXPENSES,
          label:
            prototype.pitchedSolutionsProgress >= 4
              ? 'Pay Disbursements'
              : intl.formatMessage({ id: 'ToCollectives', defaultMessage: 'To Collectives' }),
        },
        {
          section: ALL_SECTIONS.EXPENSES,
          label:
            prototype.pitchedSolutionsProgress >= 5
              ? 'Approve Payment Requests'
              : intl.formatMessage(
                  {
                    id: 'hZhgoW',
                    defaultMessage: 'To {accountName}',
                  },
                  { accountName: account.name },
                ),
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
          if: prototype.pitchedSolutionsProgress < 6,
        },
        {
          section: 'unpaid-payment-requests',
          label: 'Unpaid Payment Requests',
          if: prototype.pitchedSolutionsProgress >= 5,
        },
        {
          label: intl.formatMessage({
            defaultMessage: 'Outgoing Contributions',
            id: 'Ur6Tz1',
          }),
          if: prototype.pitchedSolutionsProgress >= 2,

          section: ALL_SECTIONS.OUTGOING_CONTRIBUTIONS,
        },
      ],
    },
    {
      if: !isIndividual && !isCommunityManagerOnly,
      type: 'group',
      label:
        prototype.pitchedSolutionsProgress >= 2
          ? 'Incoming Money'
          : intl.formatMessage({ id: 'Contributions', defaultMessage: 'Contributions' }),
      Icon: Coins,
      subMenu: [
        {
          if: prototype.pitchedSolutionsProgress >= 3,
          label: 'Received Money',
          section: 'received-money',
        },
        {
          if: (isHost && canHostAccounts) || isSelfHosted,
          label:
            prototype.pitchedSolutionsProgress >= 1
              ? 'Incoming Contributions'
              : intl.formatMessage({ id: 'ToCollectives', defaultMessage: 'To Collectives' }),
          section: ALL_SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS,
        },
        {
          label: intl.formatMessage(
            {
              id: 'hZhgoW',
              defaultMessage: 'To {accountName}',
            },
            { accountName: account.name },
          ),
          if: !isHost || prototype.pitchedSolutionsProgress <= 0,
          section: ALL_SECTIONS.INCOMING_CONTRIBUTIONS,
        },
        {
          label: intl.formatMessage(
            {
              id: 'PVqJoO',
              defaultMessage: 'From {accountName}',
            },
            { accountName: account.name },
          ),
          if: prototype.pitchedSolutionsProgress < 2,

          section: ALL_SECTIONS.OUTGOING_CONTRIBUTIONS,
        },
        {
          label: 'Incomplete Contributions',
          if: prototype.pitchedSolutionsProgress >= 2,
          section: 'incomplete-contributions',
        },
        {
          label: 'Issued Payment Requests',
          if: prototype.pitchedSolutionsProgress >= 2,
          section: 'issued-payment-requests', // or HOST_EXPECTED_FUNDS
        },
      ],
    },
    {
      if: prototype.pitchedSolutionsProgress >= 7,
      label: 'Internal Transfers',
      section: 'internal-transfers',
      Icon: ArrowRightLeft,
    },
    {
      if: isIndividual && hasIssuedGrantRequests,
      Icon: Receipt,
      label: intl.formatMessage({ defaultMessage: 'Grant Requests', id: 'fng2Fr' }),
      section: ALL_SECTIONS.SUBMITTED_GRANTS,
    },
    {
      if: !isIndividual,
      type: 'group',
      Icon: Receipt,
      label:
        isHost || isSelfHosted
          ? intl.formatMessage({ defaultMessage: 'Funds & Grants', id: 'cjQcnL' })
          : intl.formatMessage({ defaultMessage: 'Grants', id: 'Csh2rX' }),
      subMenu: [
        {
          if: isHost && canHostAccounts,
          section: ALL_SECTIONS.HOSTED_FUNDS,
        },
        {
          if: (isHost && canHostAccounts) || isSelfHosted,
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
      if: isIndividual && !isCommunityManagerOnly,
      section: ALL_SECTIONS.OUTGOING_CONTRIBUTIONS,
      label: intl.formatMessage({ id: 'Contributions', defaultMessage: 'Contributions' }),
      Icon: Coins,
    },
    {
      if: !isIndividual && !isCommunityManagerOnly,
      section: ALL_SECTIONS.CONTRIBUTORS,
      label: intl.formatMessage({ id: 'Contributors', defaultMessage: 'Contributors' }),
      Icon: BookUserIcon,
    },

    {
      if: (isHost || isSelfHosted) && !isCommunityManagerOnly && prototype.pitchedSolutionsProgress < 2,
      label: intl.formatMessage({ defaultMessage: 'Expected Funds', id: 'ExpectedFunds' }),
      Icon: Coins,
      section: ALL_SECTIONS.HOST_EXPECTED_FUNDS,
    },
    {
      if: isHost && !isAccountantOnly && !isCommunityManagerOnly && canHostAccounts,
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
      if: shouldIncludeMenuItemWithLegacyFallback(account, FEATURES.AGREEMENTS, isHost && canHostAccounts),
      Icon: Signature,
      label: intl.formatMessage({ id: 'Agreements', defaultMessage: 'Agreements' }),
    },
    {
      if: (isHost || isSelfHosted) && LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.PEOPLE_DASHBOARD),
      label: intl.formatMessage({ id: 'People', defaultMessage: 'People' }),
      section: ALL_SECTIONS.PEOPLE,
      Icon: Users2,
    },
    {
      section: ALL_SECTIONS.HOST_TAX_FORMS,
      Icon: FileText,
      label: intl.formatMessage({ defaultMessage: 'Tax Forms', id: 'skSw4d' }),
      if: shouldIncludeMenuItemWithLegacyFallback(
        account,
        FEATURES.TAX_FORMS,
        isHost && Boolean(account.host?.requiredLegalDocuments?.includes('US_TAX_FORM')),
      ),
    },
    {
      if: isHost && hasFeature(account, FEATURES.VIRTUAL_CARDS) && !isAccountantOnly && !isCommunityManagerOnly,
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
      if: isHost && !isCommunityManagerOnly,
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
      ],
    },
    {
      if: !isHost && !isIndividual && !isCommunityManagerOnly,
      label: intl.formatMessage({ id: 'Reports', defaultMessage: 'Reports' }),
      Icon: BarChart2,
      section: ALL_SECTIONS.TRANSACTION_REPORTS,
    },
    {
      if: (isHost || isSelfHosted) && !isAccountantOnly && !isCommunityManagerOnly,
      section: ALL_SECTIONS.VENDORS,
      Icon: Store,
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
      if: !(isHost || isSelfHosted) && !isCommunityManagerOnly,
      section: ALL_SECTIONS.TRANSACTIONS,
      Icon: ArrowRightLeft,
    },
    {
      if: (isHost || isSelfHosted) && !isCommunityManagerOnly,
      type: 'group',
      label: intl.formatMessage({ defaultMessage: 'Ledger', id: 'scwekL' }),
      Icon: ArrowRightLeft,
      subMenu: [
        {
          section: ALL_SECTIONS.HOST_TRANSACTIONS,
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
        (account.type !== 'ORGANIZATION' || isActiveHost) &&
        !isAccountantOnly &&
        !isCommunityManagerOnly,
      section: ALL_SECTIONS.TIERS,
      Icon: HeartHandshake,
    },
    {
      if: !isIndividual && !isAccountantOnly && !isCommunityManagerOnly,
      section: ALL_SECTIONS.TEAM,
      Icon: Users2,
    },
    {
      if:
        isOneOfTypes(account, [COLLECTIVE, FUND, EVENT, PROJECT]) &&
        hasFeature(account.host, FEATURES.VIRTUAL_CARDS) &&
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
      subMenu: settingsMenu,
    },
  ];

  return { main: filterAndLabel(items, intl) };
};

export function AppSidebar({ isLoading, useLegacy = false, prototypeSettings, variant = 'inset' }: AppSidebarProps) {
  const { workspace, account } = useWorkspace();
  const {
    recentSections,
    pinnedSections,
    togglePinnedSection,
    isSectionPinned,
    activeSectionHighlight,
    setActiveSectionHighlight,
  } = React.useContext(DashboardContext);
  console.log({ activeSectionHighlight });
  const activeSlug = workspace?.slug;
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const computedMenuItems = React.useMemo(
    () => getMenuItems({ intl, account, LoggedInUser, prototype: prototypeSettings }),
    [account, intl, LoggedInUser, prototypeSettings],
  );
  const { main: mainMenuItems, tools: toolMenuItems } = React.useMemo(() => {
    if (Array.isArray(computedMenuItems)) {
      return { main: computedMenuItems, tools: undefined };
    }
    return {
      main: computedMenuItems.main ?? [],
      tools: computedMenuItems.tools,
    };
  }, [computedMenuItems]);

  const getGroupKey = React.useCallback(
    (item: MenuItem, index: number) => (item.type === 'group' ? item.label : item.section) ?? `group-${index}`,
    [],
  );

  const sectionSourceMap = React.useMemo(() => {
    const map = new Map<string, 'menu' | 'tools'>();

    const registerItems = (items: MenuItem[], source: 'menu' | 'tools') => {
      for (const item of items) {
        if (item.type === 'group' && item.subMenu) {
          for (const subItem of item.subMenu) {
            if ('section' in subItem && subItem.section && !map.has(subItem.section)) {
              map.set(subItem.section, source);
            }
          }
        } else if ('section' in item && item.section && !map.has(item.section)) {
          map.set(item.section, source);
        }
      }
    };

    registerItems(mainMenuItems, 'menu');
    if (toolMenuItems) {
      registerItems(toolMenuItems, 'tools');
    }

    return map;
  }, [mainMenuItems, toolMenuItems]);

  const findMenuItemBySection = React.useCallback(
    (section: string): { item: PageMenuItem; source: 'menu' | 'tools' } | null => {
      const searchItems = (items: MenuItem[] | undefined, source: 'menu' | 'tools') => {
        if (!items) {
          return null;
        }

        for (const item of items) {
          if (item.type === 'group' && item.subMenu) {
            const subItem = item.subMenu.find(subItem => 'section' in subItem && subItem.section === section);
            if (subItem && 'section' in subItem) {
              return { item: subItem, source };
            }
          } else if ('section' in item && item.section === section) {
            return { item: item as PageMenuItem, source };
          }
        }

        return null;
      };

      return searchItems(mainMenuItems, 'menu') ?? searchItems(toolMenuItems, 'tools');
    },
    [mainMenuItems, toolMenuItems],
  );

  const isSectionActive = React.useCallback(
    (section: string) => {
      if (!section) {
        return false;
      }

      const currentSection = router.query.section;
      const activeSection = Array.isArray(currentSection) ? currentSection[0] : currentSection;
      return activeSection === section || router.asPath.includes(`section=${section}`);
    },
    [router.asPath, router.query.section],
  );

  const getDefaultSourceForSection = React.useCallback(
    (section: string): 'menu' | 'tools' => sectionSourceMap.get(section) ?? 'menu',
    [sectionSourceMap],
  );

  const isSectionActiveInSource = React.useCallback(
    (section: string, source: 'menu' | 'shortcut' | 'tools') => {
      // Always check activeSectionHighlight first to prevent blinking
      if (activeSectionHighlight) {
        if (activeSectionHighlight.section === section) {
          return activeSectionHighlight.source === source;
        }
        // If there's an active highlight for a different section, don't highlight this one
        if (source === 'shortcut') {
          return false;
        }
      }

      if (!isSectionActive(section)) {
        return false;
      }

      if (source === 'shortcut') {
        return false;
      }

      const defaultSource = getDefaultSourceForSection(section);

      if (defaultSource === 'tools') {
        return source === 'tools';
      }

      // Default to highlighting menu entries when no explicit highlight is set.
      return source === 'menu';
    },
    [activeSectionHighlight, getDefaultSourceForSection, isSectionActive],
  );

  const handleSectionLinkClick = React.useCallback(
    (source: 'menu' | 'shortcut' | 'tools', section: string) => {
      if (!section) {
        return;
      }

      // Prevent transient highlight flicker by updating the highlight before triggering navigation.
      setActiveSectionHighlight({ section, source });

      // If clicking a menu or tools item, open its parent group if it exists
      if (source === 'menu' || source === 'tools') {
        const items = source === 'menu' ? mainMenuItems : toolMenuItems;
        if (items) {
          for (let index = 0; index < items.length; index++) {
            const item = items[index];
            if (item.type === 'group' && item.subMenu?.some(subItem => subItem.section === section)) {
              const itemKey = getGroupKey(item, index);
              if (source === 'menu') {
                setOpenMainSubmenu(itemKey);
              } else {
                setOpenToolsSubmenu(itemKey);
              }
              break;
            }
          }
        }
      }
    },
    [getGroupKey, mainMenuItems, setActiveSectionHighlight, toolMenuItems],
  );

  const shortcuts = React.useMemo(() => {
    const pinned = Array.isArray(pinnedSections) ? pinnedSections : [];
    const recent = Array.isArray(recentSections) ? recentSections : [];

    return [...pinned, ...recent.filter(section => !pinned.includes(section))];
  }, [pinnedSections, recentSections]);

  React.useEffect(() => {
    if (!activeSectionHighlight || activeSectionHighlight.source !== 'shortcut') {
      return;
    }

    if (!shortcuts.includes(activeSectionHighlight.section)) {
      setActiveSectionHighlight(null);
    }
  }, [activeSectionHighlight, shortcuts, setActiveSectionHighlight]);

  const handlePinClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, section: string) => {
      event.preventDefault();
      event.stopPropagation();

      togglePinnedSection(section);
    },
    [togglePinnedSection],
  );

  const shouldShowShortcuts = prototypeSettings?.useShortcuts && shortcuts.length > 0;

  const mainActiveGroupKey = React.useMemo(() => {
    // Only auto-open groups if not navigating from shortcuts
    if (activeSectionHighlight?.source === 'shortcut') {
      return null;
    }

    for (let index = 0; index < mainMenuItems.length; index++) {
      const item = mainMenuItems[index];
      if (item.type === 'group' && item.subMenu?.some(subItem => subItem.section && isSectionActive(subItem.section))) {
        return getGroupKey(item, index);
      }
    }
    return null;
  }, [activeSectionHighlight?.source, getGroupKey, isSectionActive, mainMenuItems]);

  const toolsActiveGroupKey = React.useMemo(() => {
    if (!toolMenuItems) {
      return null;
    }

    // Only auto-open groups if not navigating from shortcuts
    if (activeSectionHighlight?.source === 'shortcut') {
      return null;
    }

    for (let index = 0; index < toolMenuItems.length; index++) {
      const item = toolMenuItems[index];
      if (item.type === 'group' && item.subMenu?.some(subItem => subItem.section && isSectionActive(subItem.section))) {
        return getGroupKey(item, index);
      }
    }

    return null;
  }, [activeSectionHighlight?.source, getGroupKey, isSectionActive, toolMenuItems]);

  const [openMainSubmenu, setOpenMainSubmenu] = React.useState<string | null>(() => mainActiveGroupKey);
  const [openToolsSubmenu, setOpenToolsSubmenu] = React.useState<string | null>(() => toolsActiveGroupKey);

  if (useLegacy) {
    return <AdminPanelSideBar isLoading={isLoading} activeSlug={activeSlug} menuItems={computedMenuItems} />;
  }

  return (
    <Sidebar variant={variant} collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <AccountSwitcher activeSlug={activeSlug} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="justify-between">
        <div>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map((item, index) => {
                  // Handle group items (with sub-menu)
                  if (item.type === 'group') {
                    const itemKey = getGroupKey(item, index);
                    const groupIsActive = item.subMenu?.some(subItem =>
                      subItem.section ? isSectionActiveInSource(subItem.section, 'menu') : false,
                    );

                    return (
                      <Collapsible
                        key={itemKey}
                        asChild
                        open={openMainSubmenu === itemKey}
                        onOpenChange={open => setOpenMainSubmenu(open ? itemKey : null)}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.label}
                              isActive={groupIsActive && openMainSubmenu !== itemKey}
                            >
                              {item.Icon && <item.Icon />}
                              <span>{item.label}</span>
                              <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.subMenu?.map(subItem => {
                                if (!subItem.section) {
                                  return null;
                                }

                                const section = subItem.section;

                                return (
                                  <SidebarMenuSubItem key={section}>
                                    <SidebarMenuSubButton asChild isActive={isSectionActiveInSource(section, 'menu')}>
                                      <Link
                                        shallow
                                        href={getDashboardRoute(account, section)}
                                        onClick={() => handleSectionLinkClick('menu', section)}
                                      >
                                        <span>{subItem.label}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  // Handle regular page items
                  return (
                    <SidebarMenuItem key={item.section}>
                      <SidebarMenuButton
                        asChild
                        isActive={isSectionActiveInSource(item.section, 'menu')}
                        tooltip={item.label}
                      >
                        <Link
                          shallow
                          href={getDashboardRoute(account, item.section)}
                          onClick={() => handleSectionLinkClick('menu', item.section)}
                        >
                          {item.Icon && <item.Icon />}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {shouldShowShortcuts && (
            <SidebarGroup>
              <SidebarGroupLabel>Shortcuts</SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu>
                  {shortcuts.map(section => {
                    const match = findMenuItemBySection(section);
                    if (!match) {
                      return null;
                    }

                    const { item: menuItem } = match;
                    const pinned = isSectionPinned(section);
                    const pinActionLabel = intl.formatMessage(
                      pinned ? messages.unpinFromShortcuts : messages.pinToShortcuts,
                    );

                    return (
                      <SidebarMenuItem key={section} className="group/shortcut-trigger">
                        <SidebarMenuButton
                          asChild
                          isActive={isSectionActiveInSource(section, 'shortcut')}
                          tooltip={menuItem.label}
                        >
                          <Link
                            shallow
                            href={getDashboardRoute(account, section)}
                            onClick={() => handleSectionLinkClick('shortcut', section)}
                          >
                            {pinned ? <Pin /> : <Clock />}
                            <span>{menuItem.label}</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuAction
                          type="button"
                          aria-label={pinActionLabel}
                          showOnHover
                          onClick={event => handlePinClick(event, section)}
                        >
                          {pinned ? <X className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </SidebarMenuAction>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          {toolMenuItems && (
            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu>
                  {toolMenuItems.map((item, index) => {
                    // Handle group items (with sub-menu)
                    if (item.type === 'group') {
                      const itemKey = getGroupKey(item, index);
                      const groupIsActive = item.subMenu?.some(subItem =>
                        subItem.section ? isSectionActiveInSource(subItem.section, 'tools') : false,
                      );

                      return (
                        <Collapsible
                          key={itemKey}
                          asChild
                          open={openToolsSubmenu === itemKey}
                          onOpenChange={open => {
                            console.log({ open, itemKey });
                            setOpenToolsSubmenu(open ? itemKey : null);
                          }}
                          className="group/collapsible"
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                tooltip={item.label}
                                isActive={groupIsActive && openToolsSubmenu !== itemKey}
                              >
                                {item.Icon && <item.Icon />}
                                <span>{item.label}</span>
                                <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.subMenu?.map(subItem => {
                                  if (!subItem.section) {
                                    return null;
                                  }

                                  return (
                                    <SidebarMenuSubItem key={subItem.section}>
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={isSectionActiveInSource(subItem.section, 'tools')}
                                      >
                                        <Link
                                          shallow
                                          href={getDashboardRoute(account, subItem.section)}
                                          onClick={() => handleSectionLinkClick('tools', subItem.section)}
                                        >
                                          <span>{subItem.label}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    // Handle regular page items
                    return (
                      <SidebarMenuItem key={item.section}>
                        <SidebarMenuButton
                          asChild
                          isActive={isSectionActiveInSource(item.section, 'tools')}
                          tooltip={item.label}
                        >
                          <Link
                            shallow
                            href={getDashboardRoute(account, item.section)}
                            onClick={() => handleSectionLinkClick('tools', item.section)}
                          >
                            {item.Icon && <item.Icon />}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={false}>
                <Link href={'/search'}>
                  <Telescope />
                  <span>Explore</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={false}>
                <Link href={'/help'}>
                  <LifeBuoy />
                  <span>Help & Support</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <User />
                <span>Account</span>
                <ChevronDown className="ml-auto" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter> */}
      <SidebarRail />
    </Sidebar>
  );
}

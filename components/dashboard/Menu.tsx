import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightLeft,
  BarChart2,
  BookOpenCheck,
  BookUserIcon,
  Building,
  Coins,
  CreditCard,
  FileText,
  FlaskConical,
  Globe2,
  HandCoins,
  HeartHandshake,
  LayoutDashboard,
  Megaphone,
  Receipt,
  Settings,
  Signature,
  Store,
  Ticket,
  Users,
  Users2,
  UserX,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import hasFeature, { FEATURES, isFeatureEnabled } from '../../lib/allowed-features';
import { isChildAccount, isHostAccount, isIndividualAccount, isSelfHostedAccount } from '../../lib/collective';
import { isOneOfTypes, isType } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';
import { ExpenseType } from '../../lib/graphql/types/v2/schema';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import { ALL_SECTIONS, ROOT_SECTIONS, SECTION_LABELS } from './constants';
import { DashboardContext } from './DashboardContext';
import { MenuLink } from './MenuLink';

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

export type MenuItem = PageMenuItem | GroupMenuItem;

export const getMenuItems = ({ intl, account, LoggedInUser }): MenuItem[] => {
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

  const hasIssuedGrantRequests = account.issuedGrantRequests?.totalCount > 0;
  const hasReceivedGrantRequests = account.receivedGrantRequests?.totalCount > 0;
  const showReceivedGrantRequests =
    hasReceivedGrantRequests ||
    (!isIndividual &&
      !(isHost || isSelfHosted) &&
      Boolean(account.supportedExpenseTypes?.includes?.(ExpenseType.GRANT)));

  const items: MenuItem[] = [
    {
      section: ALL_SECTIONS.OVERVIEW,
      Icon: LayoutDashboard,
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
      label: intl.formatMessage({ id: 'Expenses', defaultMessage: 'Expenses' }),
      Icon: Receipt,
      subMenu: [
        {
          if: isHost && canHostAccounts,
          section: ALL_SECTIONS.HOST_EXPENSES,
          label: intl.formatMessage({ id: 'ToCollectives', defaultMessage: 'To Collectives' }),
        },
        {
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
          if: isHost || isSelfHosted,
          section: ALL_SECTIONS.HOSTED_GRANTS,
          label: intl.formatMessage({ defaultMessage: 'Grant Requests', id: 'fng2Fr' }),
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
      if: !isIndividual && !isCommunityManagerOnly,
      type: 'group',
      label: intl.formatMessage({ id: 'Contributions', defaultMessage: 'Contributions' }),
      Icon: Coins,
      subMenu: [
        {
          if: (isHost && canHostAccounts) || isSelfHosted,
          label: intl.formatMessage({ id: 'ToCollectives', defaultMessage: 'To Collectives' }),
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
          section: ALL_SECTIONS.OUTGOING_CONTRIBUTIONS,
        },
      ],
    },
    {
      if: (isHost || isSelfHosted) && !isCommunityManagerOnly,
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
      if: isHost && canHostAccounts,
      Icon: Signature,
      label: intl.formatMessage({ id: 'Agreements', defaultMessage: 'Agreements' }),
    },
    {
      section: ALL_SECTIONS.HOST_TAX_FORMS,
      Icon: FileText,
      label: intl.formatMessage({ defaultMessage: 'Tax Forms', id: 'skSw4d' }),
      if: isHost && Boolean(account.host?.requiredLegalDocuments?.includes('US_TAX_FORM')),
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
      if: !isHost && !isCommunityManagerOnly,
      section: ALL_SECTIONS.TRANSACTIONS,
      Icon: ArrowRightLeft,
    },
    {
      if: isHost && !isCommunityManagerOnly,
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
          if: isFeatureEnabled(account, FEATURES.OFF_PLATFORM_TRANSACTIONS),
        },
        {
          section: ALL_SECTIONS.LEDGER_CSV_IMPORTS,
          label: intl.formatMessage({ defaultMessage: 'CSV Imports', id: 'd3jA/o' }),
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
        ...(isHost || isSelfHosted
          ? [
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
                if: !isAccountantOnly && isFeatureEnabled(account, FEATURES.OFF_PLATFORM_TRANSACTIONS),
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
          if: isOneOfTypes(account, [COLLECTIVE, EVENT, PROJECT]),
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
      })
  );
};

const Menu = ({ onRoute, menuItems }) => {
  const router = useRouter();
  const intl = useIntl();
  const { account } = React.useContext(DashboardContext);
  const { LoggedInUser } = useLoggedInUser();
  React.useEffect(() => {
    if (onRoute) {
      router.events.on('routeChangeStart', onRoute);
    }
    return () => {
      if (onRoute) {
        router.events.off('routeChangeStart', onRoute);
      }
    };
  }, [router, onRoute]);

  const showLinkToProfilePrototype =
    !['ROOT', 'ORGANIZATION', 'FUND', 'INDIVIDUAL'].includes(account.type) &&
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.CROWDFUNDING_REDESIGN);

  return (
    <div className="space-y-4">
      {account.type !== 'ROOT' && (
        <div className="flex flex-col gap-2">
          <MenuLink
            href={getCollectivePageRoute(account)}
            Icon={Globe2}
            label={intl.formatMessage({ id: 'PublicProfile', defaultMessage: 'Public profile' })}
            className="hover:bg-slate-50 hover:text-slate-700"
            dataCy="public-profile-link"
            external
          />
          {showLinkToProfilePrototype && (
            <MenuLink
              href={`/preview/${account.slug}`}
              Icon={FlaskConical}
              label={intl.formatMessage({ defaultMessage: 'Preview new profile page', id: 'ob6Sw2' })}
              className="hover:bg-slate-50 hover:text-slate-700"
              external
            />
          )}
        </div>
      )}
      <div className="space-y-2">
        {menuItems.map(item => {
          const key = item.type === 'group' ? item.label : item.section;
          return <MenuLink key={key} {...item} />;
        })}
      </div>
    </div>
  );
};

export default Menu;

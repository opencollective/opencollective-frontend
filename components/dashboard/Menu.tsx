import React from 'react';
import { get } from 'lodash';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightLeft,
  BarChart2,
  BookUserIcon,
  Building,
  Coins,
  CreditCard,
  FileText,
  Globe2,
  HeartHandshake,
  LayoutDashboard,
  Receipt,
  Settings,
  Store,
  Ticket,
  Users2,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { isHostAccount, isIndividualAccount, isInternalHost, isSelfHostedAccount } from '../../lib/collective';
import { isOneOfTypes, isType } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import { ALL_SECTIONS, SECTION_LABELS } from './constants';
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

export type MenuItem = PageMenuItem | GroupMenuItem;

export const getMenuItems = ({ intl, account, LoggedInUser }): MenuItem[] => {
  const isIndividual = isIndividualAccount(account);
  const isHost = isHostAccount(account);
  const isSelfHosted = isSelfHostedAccount(account);
  const isAccountantOnly = LoggedInUser?.isAccountantOnly(account);
  const isActive = account.isActive;
  const isActiveHost = isHost && isActive;

  const items: MenuItem[] = [
    {
      if: isIndividual || (LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.COLLECTIVE_OVERVIEW) && !isHost),
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
      if: !isIndividual,
      type: 'group',
      label: intl.formatMessage({ id: 'Expenses', defaultMessage: 'Expenses' }),
      Icon: Receipt,
      subMenu: [
        {
          if: isHost,
          section: ALL_SECTIONS.HOST_EXPENSES,
          label: intl.formatMessage({ id: 'ToCollectives', defaultMessage: 'To Collectives' }),
        },
        {
          section: ALL_SECTIONS.EXPENSES,
          label: intl.formatMessage(
            {
              defaultMessage: 'To {accountName}',
            },
            { accountName: account.name },
          ),
        },
        {
          section: ALL_SECTIONS.SUBMITTED_EXPENSES,
          label: intl.formatMessage(
            {
              defaultMessage: 'From {accountName}',
            },
            { accountName: account.name },
          ),
        },
      ],
    },
    {
      if: isIndividual,
      section: ALL_SECTIONS.OUTGOING_CONTRIBUTIONS,
      label: intl.formatMessage({ id: 'Contributions', defaultMessage: 'Contributions' }),
      Icon: Coins,
    },
    {
      if: !isIndividual,
      section: ALL_SECTIONS.CONTRIBUTORS,
      label: intl.formatMessage({ id: 'Contributors', defaultMessage: 'Contributors' }),
      Icon: BookUserIcon,
    },
    {
      if: !isIndividual,
      type: 'group',
      label: intl.formatMessage({ id: 'Contributions', defaultMessage: 'Contributions' }),
      Icon: Coins,
      subMenu: [
        {
          if: isHost || isSelfHosted,
          label: intl.formatMessage({ id: 'ToCollectives', defaultMessage: 'To Collectives' }),
          section: ALL_SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS,
        },
        {
          label: intl.formatMessage(
            {
              defaultMessage: 'To {accountName}',
            },
            { accountName: account.name },
          ),
          section: ALL_SECTIONS.INCOMING_CONTRIBUTIONS,
        },
        {
          label: intl.formatMessage(
            {
              defaultMessage: 'From {accountName}',
            },
            { accountName: account.name },
          ),
          section: ALL_SECTIONS.OUTGOING_CONTRIBUTIONS,
        },
      ],
    },
    {
      if: isHost && !isAccountantOnly,
      type: 'group',
      Icon: Building,
      label: intl.formatMessage({ id: 'Collectives', defaultMessage: 'Collectives' }),
      subMenu: [
        {
          section: ALL_SECTIONS.HOSTED_COLLECTIVES,
        },
        {
          label: intl.formatMessage({ defaultMessage: 'Applications' }),
          section: ALL_SECTIONS.HOST_APPLICATIONS,
        },
      ],
    },
    {
      if: isInternalHost(account) || Boolean(get(account, 'settings.beta.HOST_AGREEMENTS')),
      section: ALL_SECTIONS.HOST_AGREEMENTS,
      Icon: FileText,
      label: intl.formatMessage({ id: 'Agreements', defaultMessage: 'Agreements' }),
    },
    {
      if: isHost && hasFeature(account, FEATURES.VIRTUAL_CARDS) && !isAccountantOnly,
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
      if: isHost,
      section: ALL_SECTIONS.REPORTS,
      Icon: BarChart2,
    },
    {
      if: isHost && !isAccountantOnly,
      section: ALL_SECTIONS.VENDORS,
      Icon: Store,
    },
    {
      if: isType(account, EVENT),
      section: ALL_SECTIONS.TICKETS,
      label: intl.formatMessage({ defaultMessage: 'Ticket tiers' }),
      Icon: Ticket,
    },
    {
      if: isType(account, EVENT),
      section: ALL_SECTIONS.TIERS,
      label: intl.formatMessage({ defaultMessage: 'Sponsorship tiers' }),
      Icon: HeartHandshake,
    },
    {
      if: !isHost,
      section: ALL_SECTIONS.TRANSACTIONS,
      Icon: ArrowRightLeft,
    },
    {
      if: isHost,
      section: ALL_SECTIONS.HOST_TRANSACTIONS,
      Icon: ArrowRightLeft,
      label: intl.formatMessage({ id: 'menu.transactions', defaultMessage: 'Transactions' }),
    },
    {
      if:
        !isOneOfTypes(account, [EVENT, USER]) && (account.type !== 'ORGANIZATION' || isActiveHost) && !isAccountantOnly,
      section: ALL_SECTIONS.TIERS,
      Icon: HeartHandshake,
    },
    {
      if: !isIndividual && !isAccountantOnly,
      section: ALL_SECTIONS.TEAM,
      Icon: Users2,
    },
    {
      if:
        isOneOfTypes(account, [COLLECTIVE, FUND, EVENT, PROJECT]) &&
        hasFeature(account.host, FEATURES.VIRTUAL_CARDS) &&
        account.isApproved,
      section: ALL_SECTIONS.VIRTUAL_CARDS,
      Icon: CreditCard,
    },
    {
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
          section: ALL_SECTIONS.COLLECTIVE_PAGE,
          if: !isAccountantOnly,
        },
        {
          section: ALL_SECTIONS.CONNECTED_ACCOUNTS, // Displayed as "Social accounts"
          if: isOneOfTypes(account, [COLLECTIVE, ORGANIZATION]) && !isAccountantOnly,
        },
        // Host sections
        ...(isHost || isSelfHosted
          ? [
              {
                section: ALL_SECTIONS.FISCAL_HOSTING,
                if: !isAccountantOnly && !isSelfHosted,
              },
              {
                section: ALL_SECTIONS.POLICIES,
                if: isOneOfTypes(account, [USER, ORGANIZATION]) && !isAccountantOnly,
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
                section: ALL_SECTIONS.CHART_OF_ACCOUNTS,
                if: Boolean(LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.EXPENSE_CATEGORIZATION)),
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

  return (
    <div className="space-y-4">
      <MenuLink
        href={getCollectivePageRoute(account)}
        Icon={Globe2}
        label={intl.formatMessage({ id: 'PublicProfile', defaultMessage: 'Public profile' })}
        className="hover:bg-slate-50 hover:text-slate-700"
        external
      />
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

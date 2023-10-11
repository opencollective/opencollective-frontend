import React from 'react';
import {
  ArrowRightLeft,
  BarChart2,
  Building,
  Coins,
  CreditCard,
  FileText,
  Globe2,
  HeartHandshake,
  LayoutDashboard,
  LucideIcon,
  Receipt,
  Settings,
  Ticket,
  Users2,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { isHostAccount, isIndividualAccount, isSelfHostedAccount } from '../../lib/collective.lib';
import { isOneOfTypes, isType } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import { ALL_SECTIONS } from './constants';
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

const getMenuItems = ({ intl, account, LoggedInUser }): MenuItem[] => {
  const isIndividual = isIndividualAccount(account);
  const isHost = isHostAccount(account);
  const isSelfHosted = isSelfHostedAccount(account);
  const isAccountantOnly = LoggedInUser?.isAccountantOnly(account);

  const items: MenuItem[] = [
    {
      if: isIndividual,
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
        { section: ALL_SECTIONS.HOST_EXPENSES, if: isHost },
        {
          label: intl.formatMessage({ defaultMessage: 'Received' }),
          section: ALL_SECTIONS.EXPENSES,
        },
        {
          label: intl.formatMessage({ defaultMessage: 'Submitted' }),
          section: ALL_SECTIONS.SUBMITTED_EXPENSES,
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
      type: 'group',
      label: intl.formatMessage({ id: 'Contributions', defaultMessage: 'Contributions' }),
      Icon: Coins,
      subMenu: [
        {
          if: isHost || isSelfHosted,
          label: intl.formatMessage({ id: 'FinancialContributions', defaultMessage: 'Financial Contributions' }),
          section: ALL_SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS,
        },
        {
          label: intl.formatMessage({ defaultMessage: 'Incoming' }),
          section: ALL_SECTIONS.INCOMING_CONTRIBUTIONS,
        },
        {
          label: intl.formatMessage({ defaultMessage: 'Outgoing' }),
          section: ALL_SECTIONS.OUTGOING_CONTRIBUTIONS,
        },
      ],
    },
    {
      if: isHost,
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
      if: isHost,
      section: ALL_SECTIONS.HOST_AGREEMENTS,
      Icon: FileText,
      label: intl.formatMessage({ id: 'Agreements', defaultMessage: 'Agreements' }),
    },
    {
      if: isHost && hasFeature(account, FEATURES.VIRTUAL_CARDS),
      type: 'group',
      label: intl.formatMessage({ id: 'VirtualCards.Title', defaultMessage: 'Virtual Cards' }),
      Icon: CreditCard,
      subMenu: [
        {
          section: ALL_SECTIONS.HOST_VIRTUAL_CARDS,
        },
        {
          label: intl.formatMessage({ defaultMessage: 'Requests' }),
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
      section: ALL_SECTIONS.TRANSACTIONS,
      Icon: ArrowRightLeft,
    },
    {
      if: !isOneOfTypes(account, [EVENT, USER]),
      section: ALL_SECTIONS.TIERS,
      Icon: HeartHandshake,
    },
    {
      if: !isIndividual,
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
        ...(isAccountantOnly
          ? []
          : [
              { section: ALL_SECTIONS.INFO },
              { section: ALL_SECTIONS.COLLECTIVE_PAGE },
              { section: ALL_SECTIONS.COLLECTIVE_GOALS, if: isOneOfTypes(account, [COLLECTIVE, PROJECT]) },
              {
                section: ALL_SECTIONS.CONNECTED_ACCOUNTS,
                if: isOneOfTypes(account, [COLLECTIVE, ORGANIZATION]),
              },
              { section: ALL_SECTIONS.POLICIES, if: isOneOfTypes(account, [COLLECTIVE, FUND]) }, // POLICIES also available for Fiscal hosts further down in this list
              { section: ALL_SECTIONS.CUSTOM_EMAIL, if: isOneOfTypes(account, [COLLECTIVE, EVENT, PROJECT]) },
              { section: ALL_SECTIONS.EXPORT, if: isOneOfTypes(account, [COLLECTIVE, EVENT, PROJECT]) },
              { section: ALL_SECTIONS.HOST, if: isOneOfTypes(account, [COLLECTIVE, FUND]) },
              {
                section: ALL_SECTIONS.PAYMENT_METHODS,
                if: ['ACTIVE', 'AVAILABLE'].includes(account.features.USE_PAYMENT_METHODS),
              },
            ]),
        { section: ALL_SECTIONS.PAYMENT_RECEIPTS, if: isOneOfTypes(account, [INDIVIDUAL, USER, ORGANIZATION]) },
        ...(isAccountantOnly
          ? []
          : [
              {
                section: ALL_SECTIONS.NOTIFICATIONS,
                if: isIndividualAccount(account),
              },
              {
                section: ALL_SECTIONS.GIFT_CARDS,
                if: ['ACTIVE', 'AVAILABLE'].includes(account.features.EMIT_GIFT_CARDS),
              },
              { section: ALL_SECTIONS.WEBHOOKS },
              { section: ALL_SECTIONS.AUTHORIZED_APPS, if: isIndividualAccount(account) },
              { section: ALL_SECTIONS.USER_SECURITY, if: isIndividualAccount(account) },
              {
                section: ALL_SECTIONS.FOR_DEVELOPERS,
                if: isOneOfTypes(account, [COLLECTIVE, USER, INDIVIDUAL, ORGANIZATION]),
              },
              { section: ALL_SECTIONS.ACTIVITY_LOG },
              {
                section: ALL_SECTIONS.SECURITY,
                if: isOneOfTypes(account, [COLLECTIVE, FUND, ORGANIZATION]),
              },
              ...(isSelfHosted
                ? [
                    { section: ALL_SECTIONS.INVOICES_RECEIPTS },
                    { section: ALL_SECTIONS.RECEIVING_MONEY },
                    { section: ALL_SECTIONS.SENDING_MONEY },
                  ]
                : []),
              ...(isHost
                ? [
                    { section: ALL_SECTIONS.FISCAL_HOSTING },
                    { section: ALL_SECTIONS.INVOICES_RECEIPTS },
                    { section: ALL_SECTIONS.RECEIVING_MONEY },
                    { section: ALL_SECTIONS.SENDING_MONEY },
                    {
                      section: ALL_SECTIONS.HOST_VIRTUAL_CARDS_SETTINGS,
                      if: hasFeature(account, FEATURES.VIRTUAL_CARDS),
                    },
                    { section: ALL_SECTIONS.POLICIES, if: isOneOfTypes(account, [USER, ORGANIZATION]) },
                  ]
                : []),
              { section: ALL_SECTIONS.ADVANCED },
            ]),
      ],
    },
  ];

  return (
    items
      // filter root items
      .filter(item => item.if !== false)
      // filter subMenu items
      .map(item => {
        if (item.type === 'group') {
          return {
            ...item,
            subMenu: item.subMenu.filter(item => item.if !== false),
          };
        }
        return item;
      })
  );
};

const Menu = ({ onRoute }) => {
  const router = useRouter();
  const intl = useIntl();
  const { account } = React.useContext(DashboardContext);
  const { LoggedInUser } = useLoggedInUser();

  const menuItems = React.useMemo(() => getMenuItems({ intl, account, LoggedInUser }), [account, LoggedInUser, intl]);

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
          const key = item.type === 'group' ? item.subMenu[0].section : item.section;
          return <MenuLink key={key} {...item} />;
        })}
      </div>
    </div>
  );
};

export default Menu;

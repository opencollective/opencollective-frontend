import React from 'react';
import { useQuery } from '@apollo/client';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Award, Building, HandCoins, MailOpen, Receipt } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { hasAccountMoneyManagement } from '../../../../lib/collective';
import { getDashboardRoute } from '../../../../lib/url-helpers';
import { gql } from '@/lib/graphql/helpers';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';

import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

import Link from '../../../Link';
import { ALL_SECTIONS } from '../../constants';
import { DashboardContext } from '../../DashboardContext';

const hostTodoQuery = gql`
  query HostTodo($hostSlug: String!) {
    host(slug: $hostSlug) {
      id

      unrepliedApplications: hostApplications(limit: 0, offset: 0, lastCommentBy: COLLECTIVE_ADMIN) {
        totalCount
      }
      pendingApplications: hostApplications(limit: 0, offset: 0, status: PENDING) {
        totalCount
      }

      disputedOrders: orders(
        filter: INCOMING
        status: [DISPUTED]
        includeIncognito: true
        includeHostedAccounts: true
      ) {
        totalCount
      }
      inReviewOrders: orders(
        filter: INCOMING
        status: [IN_REVIEW]
        includeIncognito: true
        includeHostedAccounts: true
      ) {
        totalCount
      }
    }

    unrepliedExpenses: expenses(
      host: { slug: $hostSlug }
      status: [APPROVED, ERROR, INCOMPLETE, ON_HOLD]
      lastCommentBy: [NON_HOST_ADMIN]
    ) {
      totalCount
    }
    toPayExpenses: expenses(host: { slug: $hostSlug }, status: [READY_TO_PAY]) {
      totalCount
    }
    missingReceiptExpenses: expenses(host: { slug: $hostSlug }, chargeHasReceipts: false) {
      totalCount
    }
    onHoldExpenses: expenses(host: { slug: $hostSlug }, status: [ON_HOLD]) {
      totalCount
    }
    incompleteExpenses: expenses(host: { slug: $hostSlug }, status: [INCOMPLETE]) {
      totalCount
    }
    errorExpenses: expenses(host: { slug: $hostSlug }, status: [ERROR]) {
      totalCount
    }
  }
`;

export const HostTodoList = () => {
  const { account } = React.useContext(DashboardContext);
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();

  const { data, loading } = useQuery(hostTodoQuery, {
    variables: {
      hostSlug: account.slug,
    },
  });

  const filteredTodoList = React.useMemo(
    () =>
      [
        {
          id: 'expenses',
          title: intl.formatMessage({ defaultMessage: 'Expenses', id: 'Expenses' }),
          href: getDashboardRoute(
            account,
            LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS)
              ? ALL_SECTIONS.PAY_DISBURSEMENTS
              : ALL_SECTIONS.HOST_EXPENSES,
          ),
          icon: Receipt,
          iconBgColor: 'bg-green-50',
          iconColor: 'text-green-700',
          subItems: [
            {
              id: 'unreplied',
              show: data?.unrepliedExpenses.totalCount > 0,
              Icon: MailOpen,
              label: intl.formatMessage(
                { defaultMessage: '{count} unreplied', id: 'TodoList.Unreplied' },
                { count: data?.unrepliedExpenses.totalCount },
              ),
              queryParams:
                '?status=APPROVED&status=ERROR&status=INCOMPLETE&status=ON_HOLD&lastCommentBy=NON_HOST_ADMIN',
            },
            {
              id: 'to-pay',
              show: data?.toPayExpenses.totalCount > 0,
              label: intl.formatMessage(
                { defaultMessage: '{count} to pay', id: 'TodoList.Expenses.ToPay' },
                { count: data?.toPayExpenses.totalCount },
              ),
              queryParams: '?status=READY_TO_PAY',
            },
            {
              id: 'missing-receipts',
              show: data?.missingReceiptExpenses.totalCount > 0,
              label: intl.formatMessage(
                {
                  defaultMessage: '{count, plural, one {# missing receipt} other {# missing receipts}}',
                  id: 'TodoList.Expenses.MissingReceipts',
                },
                { count: data?.missingReceiptExpenses.totalCount },
              ),
              href: getDashboardRoute(
                account,
                LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS)
                  ? ALL_SECTIONS.PAID_DISBURSEMENTS
                  : ALL_SECTIONS.HOST_EXPENSES,
              ),
              queryParams: `?chargeHasReceipts=false${LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS) ? '' : '&status=ALL'}`,
            },

            {
              id: 'on-hold',
              show: data?.onHoldExpenses.totalCount > 0,
              label: intl.formatMessage(
                { defaultMessage: '{count} on hold', id: 'TodoList.Expenses.OnHold' },
                { count: data?.onHoldExpenses.totalCount },
              ),
              queryParams: '?status=ON_HOLD',
            },
            {
              id: 'incomplete',
              show: data?.incompleteExpenses.totalCount > 0,
              label: intl.formatMessage(
                { defaultMessage: '{count} incomplete', id: 'TodoList.Expenses.Incomplete' },
                { count: data?.incompleteExpenses.totalCount },
              ),
              queryParams: '?status=INCOMPLETE',
            },
            {
              id: 'error',
              show: data?.errorExpenses.totalCount > 0,
              label: intl.formatMessage(
                { defaultMessage: '{count, plural, one {# error} other {# errors}}', id: 'TodoList.Expenses.Errored' },
                { count: data?.errorExpenses.totalCount },
              ),
              queryParams: '?status=ERROR',
            },
          ],
        },
        {
          id: 'contributions',
          title: intl.formatMessage({ defaultMessage: 'Contributions', id: 'Contributions' }),
          href: getDashboardRoute(account, 'incoming-contributions'),
          icon: HandCoins,
          iconBgColor: 'bg-amber-50',
          iconColor: 'text-amber-700',
          subItems: [
            {
              id: 'disputed',
              show: data?.host.disputedOrders.totalCount > 0,
              label: intl.formatMessage(
                { defaultMessage: '{count} disputed', id: 'TodoList.Contributions.Disputed' },
                { count: data?.host.disputedOrders.totalCount },
              ),
              queryParams: '?status=DISPUTED',
            },
            {
              id: 'in-review',
              show: data?.host.inReviewOrders.totalCount > 0,
              label: intl.formatMessage(
                { defaultMessage: '{count} in review', id: 'TodoList.Contributions.InReview' },
                { count: data?.host.inReviewOrders.totalCount },
              ),
              queryParams: '?status=IN_REVIEW',
            },
          ],
        },
        {
          id: 'applications',
          title: intl.formatMessage({ defaultMessage: 'Applications', id: 'HostApplications.Applications' }),
          href: getDashboardRoute(account, 'host-applications'),
          icon: Building,
          iconBgColor: 'bg-blue-50',
          iconColor: 'text-blue-700',
          subItems: [
            {
              id: 'unreplied',
              show: data?.host.unrepliedApplications.totalCount > 0,
              Icon: MailOpen,
              label: intl.formatMessage(
                { defaultMessage: '{count} unreplied', id: 'TodoList.Unreplied' },
                { count: data?.host.unrepliedApplications.totalCount },
              ),
              queryParams: '?lastCommentBy=COLLECTIVE_ADMIN',
            },
            {
              id: 'pending',
              show: data?.host.pendingApplications.totalCount > 0,
              label: intl.formatMessage(
                { defaultMessage: '{count} pending', id: 'TodoList.Pending' },
                { count: data?.host.pendingApplications.totalCount },
              ),
              queryParams: '?status=PENDING&lastCommentBy=ALL',
            },
          ],
        },
      ]
        .map(item => ({
          ...item,
          subItems: item.subItems.filter(badge => badge.show),
        }))
        .filter(item => item.subItems.length > 0),

    [data, account, intl, LoggedInUser],
  );

  return (
    <Card className="overflow-hidden pb-0">
      <CardHeader>
        <CardTitle className="text-xl">
          <FormattedMessage defaultMessage="To do" id="vwqEeH" />
        </CardTitle>
      </CardHeader>

      <div className="divide-y border-t">
        {loading ? (
          <div className="px-6 py-4">
            <Skeleton className="h-6 w-36" />
          </div>
        ) : filteredTodoList.length === 0 ? (
          <p className="px-6 py-4 text-muted-foreground">
            <FormattedMessage defaultMessage="You’re all caught up." id="ToDo.EmptyStateMessage" />
          </p>
        ) : (
          filteredTodoList.map(item => {
            const IconComponent = item.icon;

            return (
              <div
                key={item.id}
                className="group relative transition-colors hover:bg-primary/5 has-[.badge-hover:hover]:bg-background"
              >
                <Link href={item.href} className="absolute inset-0" aria-label={item.title}>
                  <span className="sr-only">{item.title}</span>
                </Link>

                <div className="pointer-events-none relative flex flex-col justify-between px-4 py-3 sm:flex-row sm:items-center">
                  <div className="mb-2 flex items-center gap-3 sm:mb-0">
                    <div className={`rounded-md ${item.iconBgColor} p-2`}>
                      <IconComponent className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <h3 className="font-medium">{item.title}</h3>
                  </div>
                  <div className="pointer-events-auto flex flex-wrap items-center gap-2">
                    {item.subItems.map(subItem => (
                      <Link key={subItem.id} href={`${subItem.href ?? item.href}${subItem.queryParams ?? ''}`}>
                        <Badge
                          type="outline"
                          className={
                            'badge-hover gap-1 rounded-full text-foreground hover:relative hover:z-10 hover:bg-primary/5'
                          }
                        >
                          {subItem.Icon && <subItem.Icon className="h-3 w-3" />}
                          <span>{subItem.label}</span>
                        </Badge>
                      </Link>
                    ))}
                    <ArrowRight className="ml-1 hidden h-4 w-4 sm:block" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

// Query for self-hosted organization specific todos (READY_TO_PAY, etc.)
const moneyManagingOrgTodoQuery = gql`
  query MoneyManagingOrgTodo($slug: String!) {
    toPayExpenses: expenses(account: { slug: $slug }, status: [READY_TO_PAY], includeChildrenExpenses: true) {
      totalCount
    }
  }
`;

type AccountTodoItem = {
  id: string;
  show: boolean;
  Icon: LucideIcon;
  message: React.ReactNode;
};

// For Hosted Collectives and Orgs with money management (but without hosting)
export const AccountTodoList = () => {
  const { account } = React.useContext(DashboardContext);
  const { LoggedInUser } = useLoggedInUser();

  const isOrgWithMoneyManagment = account?.type === 'ORGANIZATION' && hasAccountMoneyManagement(account);

  // Additional query for orgs with money management
  const { data } = useQuery(moneyManagingOrgTodoQuery, {
    variables: { slug: account?.slug },
    skip: !isOrgWithMoneyManagment,
  });

  const pendingExpenseCount = account?.pendingExpenses?.totalCount || 0;
  const pendingGrantCount = account?.pendingGrants?.totalCount || 0;
  const pausedIncomingContributionsCount = account?.pausedResumableIncomingContributions?.totalCount || 0;
  const pausedOutgoingContributions = account?.pausedOutgoingContributions?.totalCount || 0;
  const canStartResumeContributionsProcess = account?.canStartResumeContributionsProcess;
  const canActOnPausedIncomingContributions =
    pausedIncomingContributionsCount > 0 && canStartResumeContributionsProcess;

  // Expenses to pay, for orgs with money management
  const toPayExpenseCount = data?.toPayExpenses?.totalCount || 0;

  const expensesHref = getDashboardRoute(
    account,
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS)
      ? ALL_SECTIONS.PAYMENT_REQUESTS
      : ALL_SECTIONS.EXPENSES,
  );

  const createLink = (href: string) => (chunks: React.ReactNode) => (
    <Link className="font-medium text-primary hover:underline" href={href}>
      {chunks}
    </Link>
  );

  const todoItems: AccountTodoItem[] = [
    {
      id: 'pending-expenses',
      show: pendingExpenseCount > 0,
      Icon: Receipt,
      message: (
        <FormattedMessage
          defaultMessage="{pendingExpenseCount, plural, one {<Link>{pendingExpenseCount} expense</Link> has} other {<Link>{pendingExpenseCount} expenses</Link> have}} not been reviewed"
          id="PcyeDN"
          values={{
            Link: createLink(`${expensesHref}?status=PENDING`),
            pendingExpenseCount,
          }}
        />
      ),
    },
    {
      id: 'to-pay-expenses',
      show: isOrgWithMoneyManagment && toPayExpenseCount > 0,
      Icon: Receipt,
      message: (
        <FormattedMessage
          defaultMessage="{toPayExpenseCount, plural, one {<Link>{toPayExpenseCount} expense</Link> is} other {<Link>{toPayExpenseCount} expenses</Link> are}} ready to pay"
          id="SelfHostedTodo.ExpensesToPay"
          values={{
            Link: createLink(`${expensesHref}?status=READY_TO_PAY`),
            toPayExpenseCount,
          }}
        />
      ),
    },
    {
      id: 'pending-grants',
      show: pendingGrantCount > 0,
      Icon: Award,
      message: (
        <FormattedMessage
          defaultMessage="{pendingGrantCount, plural, one {<Link>{pendingGrantCount} grant</Link> has} other {<Link>{pendingGrantCount} grants</Link> have}} not been reviewed"
          id="jLe6JL"
          values={{
            Link: createLink(getDashboardRoute(account, 'grants?status=PENDING')),
            pendingGrantCount,
          }}
        />
      ),
    },
    {
      id: 'paused-incoming-contributions',
      show: canActOnPausedIncomingContributions,
      Icon: HandCoins,
      message: (
        <FormattedMessage
          defaultMessage="{pausedIncomingContributionsCount, plural, one {A recurring contribution to your account is paused} other {# recurring contributions to your account are paused}} and <Link>can be resumed</Link>."
          id="AccountTodo.PausedIncoming"
          values={{
            Link: createLink(getDashboardRoute(account, 'incoming-contributions?status=PAUSED')),
            pausedIncomingContributionsCount,
          }}
        />
      ),
    },
    {
      id: 'paused-outgoing-contributions',
      show: pausedOutgoingContributions > 0,
      Icon: HandCoins,
      message: (
        <FormattedMessage
          defaultMessage="{pausedOutgoingContributions, plural, one {One of your recurring contributions is paused} other {# of your recurring contributions are paused}} and <Link>can be resumed</Link>."
          id="4HaZeO"
          values={{
            Link: createLink(getDashboardRoute(account, 'outgoing-contributions?status=PAUSED')),
            pausedOutgoingContributions,
          }}
        />
      ),
    },
  ];

  const visibleTodos = todoItems.filter(item => item.show);

  if (visibleTodos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="text-lg font-bold">
        <FormattedMessage defaultMessage="To do" id="vwqEeH" />
      </div>
      <div className="divide-y rounded-xl border bg-slate-50">
        {visibleTodos.map(item => (
          <div key={item.id} className="p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <item.Icon size={16} />
              <span>{item.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

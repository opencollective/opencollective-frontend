import React from 'react';
import { useQuery } from '@apollo/client';
import { ArrowRight, Building, Coins, MailOpen, Receipt } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

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
          icon: Coins,
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

    [data, account, intl],
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
                      <Link key={subItem.id} href={`${item.href}${subItem.queryParams ?? ''}`}>
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

export const AccountTodoList = () => {
  const { account } = React.useContext(DashboardContext);

  const pendingExpenseCount = account?.pendingExpenses.totalCount;
  const pendingGrantCount = account?.pendingGrants.totalCount;
  const pausedIncomingContributionsCount = account?.pausedResumableIncomingContributions.totalCount;
  const pausedOutgoingContributions = account?.pausedOutgoingContributions.totalCount;
  const canStartResumeContributionsProcess = account?.canStartResumeContributionsProcess;
  const canActOnPausedIncomingContributions =
    pausedIncomingContributionsCount > 0 && canStartResumeContributionsProcess;

  if (
    !pendingExpenseCount &&
    !pendingGrantCount &&
    !pausedOutgoingContributions &&
    !canActOnPausedIncomingContributions
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="text-lg font-bold">
        <FormattedMessage defaultMessage="To do" id="vwqEeH" />
      </div>
      <div className="divide-y rounded-xl border bg-slate-50">
        {pendingExpenseCount > 0 && (
          <div className="p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Receipt size={16} />
              <span>
                <FormattedMessage
                  defaultMessage="{pendingExpenseCount, plural, one {<Link>{pendingExpenseCount} expense</Link> has} other {<Link>{pendingExpenseCount} expenses</Link> have}} not been reviewed"
                  id="PcyeDN"
                  values={{
                    Link: chunks => (
                      <Link
                        className="font-medium text-primary hover:underline"
                        href={getDashboardRoute(account, 'expenses?status=PENDING')}
                      >
                        {chunks}
                      </Link>
                    ),
                    pendingExpenseCount: pendingExpenseCount,
                  }}
                />
              </span>
            </div>
          </div>
        )}

        {pendingGrantCount > 0 && (
          <div className="p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Receipt size={16} />
              <span>
                <FormattedMessage
                  defaultMessage="{pendingGrantCount, plural, one {<Link>{pendingGrantCount} grant</Link> has} other {<Link>{pendingGrantCount} grants</Link> have}} not been reviewed"
                  id="jLe6JL"
                  values={{
                    Link: chunks => (
                      <Link
                        className="font-medium text-primary hover:underline"
                        href={getDashboardRoute(account, 'grants?status=PENDING')}
                      >
                        {chunks}
                      </Link>
                    ),
                    pendingGrantCount: pendingGrantCount,
                  }}
                />
              </span>
            </div>
          </div>
        )}

        {canActOnPausedIncomingContributions && (
          <div className="p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins size={16} />
              <span>
                <FormattedMessage
                  defaultMessage="{pausedIncomingContributionsCount, plural, one {A recurring contribution to your Collective is paused} other {# recurring contributions to your Collective are paused}} and <Link>can be resumed</Link>."
                  id="qck/cA"
                  values={{
                    Link: chunks => (
                      <Link
                        className="font-medium text-primary hover:underline"
                        href={getDashboardRoute(account, 'incoming-contributions?status=PAUSED')}
                      >
                        {chunks}
                      </Link>
                    ),
                    pausedIncomingContributionsCount: pausedIncomingContributionsCount,
                  }}
                />
              </span>
            </div>
          </div>
        )}

        {pausedOutgoingContributions > 0 && (
          <div className="p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins size={16} />
              <span>
                <FormattedMessage
                  defaultMessage="{pausedOutgoingContributions, plural, one {One of your recurring contributions is paused} other {# of your recurring contributions are paused}} and <Link>can be resumed</Link>."
                  id="4HaZeO"
                  values={{
                    Link: chunks => (
                      <Link
                        className="font-medium text-primary hover:underline"
                        href={getDashboardRoute(account, 'outgoing-contributions?status=PAUSED')}
                      >
                        {chunks}
                      </Link>
                    ),
                    pausedOutgoingContributions: pausedOutgoingContributions,
                  }}
                />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

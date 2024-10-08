import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useQueryFilter from '../../lib/hooks/useQueryFilter';
import { getDashboardRoute } from '../../lib/url-helpers';

import { DashboardContext } from '../dashboard/DashboardContext';
import DashboardHeader from '../dashboard/DashboardHeader';
import { childAccountFilter } from '../dashboard/filters/ChildAccountFilter';
import { Filterbar } from '../dashboard/filters/Filterbar';
import { periodCompareFilter } from '../dashboard/filters/PeriodCompareFilter';
import { Accounts } from '../dashboard/sections/overview/Accounts';
import AccountTable from '../dashboard/sections/overview/AccountTable';
import type { MetricProps } from '../dashboard/sections/overview/Metric';
import { Metric } from '../dashboard/sections/overview/Metric';
import { overviewMetricsQuery } from '../dashboard/sections/overview/queries';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { Account, TimeUnit } from '../../lib/graphql/types/v2/graphql';
import { accountHoverCardFields } from '../AccountHoverCard';
import AccountsList from './AccountsList';
import { ProfileMetric } from './ProfileMetric';
import clsx from 'clsx';
import ComparisonChart from '../dashboard/sections/overview/ComparisonChart';
import { PeriodFilterCompare, PeriodFilterType } from '../dashboard/filters/PeriodCompareFilter/schema';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TransactionGroups } from './TransactionGroups';
import Link from '../Link';

const profileAccountsQuery = gql`
  query MetricsPerAccount(
    $slug: String!
    $dateFrom: DateTime
    $dateTo: DateTime
    $compareFrom: DateTime
    $compareTo: DateTime
    $includeComparison: Boolean!
    $includeBalance: Boolean!
    $includeSpent: Boolean!
    $includeReceived: Boolean!
    $includeBalanceTimeseries: Boolean!
    $includeReceivedTimeseries: Boolean!
    $timeUnit: TimeUnit
    $includeChildren: Boolean!
  ) {
    account(slug: $slug) {
      id
      name
      type

      totalBalance: stats {
        id
        current: balance(includeChildren: $includeChildren, dateTo: $dateTo) {
          currency
          valueInCents
        }
        comparison: balance(includeChildren: $includeChildren, dateTo: $compareTo) @include(if: $includeComparison) {
          currency
          valueInCents
        }
      }

      balanceTimeseries: stats @include(if: $includeBalanceTimeseries) {
        id
        current: balanceTimeSeries(
          includeChildren: $includeChildren
          dateFrom: $dateFrom
          dateTo: $dateTo
          timeUnit: $timeUnit
        ) {
          dateTo
          dateFrom
          timeUnit
          nodes {
            date
            amount {
              currency
              value
            }
          }
        }
        comparison: balanceTimeSeries(
          includeChildren: $includeChildren
          dateFrom: $compareFrom
          dateTo: $compareTo
          timeUnit: $timeUnit
        ) @include(if: $includeComparison) {
          dateTo
          dateFrom
          timeUnit
          nodes {
            date
            amount {
              currency
              value
            }
          }
        }
      }

      totalSpent: stats {
        id
        current: totalAmountSpent(includeChildren: $includeChildren, dateFrom: $dateFrom, dateTo: $dateTo, net: true) {
          currency
          valueInCents
        }
        comparison: totalAmountSpent(
          includeChildren: $includeChildren
          dateFrom: $compareFrom
          dateTo: $compareTo
          net: true
        ) @include(if: $includeComparison) {
          currency
          valueInCents
        }
      }
      totalReceived: stats {
        id
        current: totalAmountReceived(
          includeChildren: $includeChildren
          dateFrom: $dateFrom
          dateTo: $dateTo
          net: true
        ) {
          currency
          valueInCents
        }
        comparison: totalAmountReceived(
          includeChildren: $includeChildren
          dateFrom: $compareFrom
          dateTo: $compareTo
          net: true
        ) @include(if: $includeComparison) {
          currency
          valueInCents
        }
      }

      receivedTimeseries: stats @include(if: $includeReceivedTimeseries) {
        id
        current: totalAmountReceivedTimeSeries(
          includeChildren: $includeChildren
          dateFrom: $dateFrom
          dateTo: $dateTo
          timeUnit: $timeUnit
          net: true
        ) {
          dateTo
          dateFrom
          timeUnit
          nodes {
            date
            amount {
              currency
              value
            }
          }
        }
        comparison: totalAmountReceivedTimeSeries(
          includeChildren: $includeChildren
          dateFrom: $compareFrom
          dateTo: $compareTo
          timeUnit: $timeUnit
          net: true
        ) @include(if: $includeComparison) {
          dateTo
          dateFrom
          timeUnit
          nodes {
            date
            amount {
              currency
              value
            }
          }
        }
      }

      ...AccountMetrics

      childrenAccounts {
        totalCount
        nodes {
          id
          ...AccountMetrics
        }
      }
    }
  }
  fragment AccountMetrics on Account {
    ...AccountHoverCardFields
    balance: stats @include(if: $includeBalance) {
      id
      current: balance(dateTo: $dateTo) {
        currency
        valueInCents
      }
      # comparison: balance(dateTo: $compareTo) @include(if: $includeComparison) {
      #   currency
      #   valueInCents
      # }
    }
    spent: stats @include(if: $includeSpent) {
      id
      current: totalAmountSpent(dateFrom: $dateFrom, dateTo: $dateTo, net: true) {
        currency
        valueInCents
      }
      # comparison: totalAmountSpent(dateFrom: $compareFrom, dateTo: $compareTo, net: true)
      #   @include(if: $includeComparison) {
      #   currency
      #   valueInCents
      # }
    }
    received: stats @include(if: $includeReceived) {
      id
      current: totalAmountReceived(dateFrom: $dateFrom, dateTo: $dateTo, net: true) {
        currency
        valueInCents
      }
      # comparison: totalAmountReceived(dateFrom: $compareFrom, dateTo: $compareTo, net: true)
      #   @include(if: $includeComparison) {
      #   currency
      #   valueInCents
      # }
    }
  }
  ${accountHoverCardFields}
`;

export const schema = z.object({
  period: periodCompareFilter.schema.default({
    type: PeriodFilterType.ALL_TIME,
    compare: PeriodFilterCompare.NO_COMPARISON,
    timeUnit: TimeUnit.MONTH,
  }),
  as: z.string().optional(),
  account: childAccountFilter.schema,
  metric: z.coerce.string().nullable().default('balance'),
});

export function ProfileAccounts() {
  const router = useRouter();
  const accountSlug = router.query.accountSlug ?? router.query.collectiveSlug;
  const queryFilter = useQueryFilter({
    schema,
    skipRouter: true,
    toVariables: {
      period: periodCompareFilter.toVariables,
      account: childAccountFilter.toVariables,
      as: slug => ({ slug }),
      metric: subpath => {
        const include = {
          includeReceived: false,
          includeReceivedTimeseries: false,
          includeBalance: false,
          includeBalanceTimeseries: false,
          includeSpent: false,
          includeContributionsCount: false,
        };
        switch (subpath) {
          case 'received':
            return {
              ...include,
              includeReceived: true,
              includeReceivedTimeseries: true,
            };

          case 'spent':
            return {
              ...include,
              includeSpent: true,
              includeReceivedTimeseries: true,
            };
          case 'balance':
          default:
            return {
              ...include,
              includeBalance: true,
              includeBalanceTimeseries: true,
            };
        }
      },
    },
    filters: {
      period: periodCompareFilter.filter,
    },
    meta: {
      accountSlug,
    },
  });

  const { data, loading, error } = useQuery(profileAccountsQuery, {
    variables: {
      slug: accountSlug,
      ...queryFilter.variables,
      includeChildren: !router.query.accountSlug,
    },
    fetchPolicy: 'cache-and-network',
    context: API_V2_CONTEXT,
  });

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  const metrics: MetricProps[] = [
    {
      id: 'balance',
      // className: 'col-span-1 row-span-2',
      label: <FormattedMessage id="TotalBalance" defaultMessage="Total Balance" />,
      helpLabel: (
        <FormattedMessage defaultMessage="Balance at end of this period, including starting balance" id="hi/nhW" />
      ),
      timeseries: { ...data?.account.balanceTimeseries, currency: data?.account.totalBalance?.current?.currency },
      amount: data?.account.totalBalance,
      // showCurrencyCode: ,
      isSnapshot: true,
      showTimeSeries: true,
    },
    {
      id: 'received',
      label: <FormattedMessage defaultMessage="Received" id="z/wUXE" />,
      helpLabel: <FormattedMessage defaultMessage="Total amount received this period" id="2kY5p5" />,
      amount: data?.account.totalReceived,
      timeseries: { ...data?.account.receivedTimeseries, currency: data?.account.totalReceived?.current?.currency },
    },
    {
      id: 'spent',
      label: <FormattedMessage defaultMessage="Spent" id="111qQK" />,
      helpLabel: <FormattedMessage defaultMessage="Total amount spent this period" id="6ctWuQ" />,
      amount: data?.account.totalSpent,
      timeseries: { ...data?.account.receivedTimeseries, currency: data?.account.totalReceived?.current?.currency },
    },
  ];

  const metric = metrics.find(m => m.id === queryFilter.values.metric) ?? metrics[0];

  // if (queryFilter.values.subpath) {
  //   const metric = metrics.find(m => m.id === queryFilter.values.subpath);
  //   if (metric) {
  //     return (
  //       <div className="flex max-w-screen-lg flex-col gap-3">
  //         <DashboardHeader
  //           title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
  //           subpathTitle={metric.label}
  //           titleRoute={getDashboardRoute(account, 'overview')}
  //         />

  //         <Filterbar hideSeparator {...queryFilter} />

  //         <Metric {...metric} loading={loading} expanded showTimeSeries showCurrencyCode>
  //           <AccountTable queryFilter={queryFilter} accountSlug={router.query?.as ?? accountSlug} metric={metric} />
  //         </Metric>
  //       </div>
  //     );
  //   }
  // }

  return (
    <div className="relative mx-auto flex max-w-screen-lg flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        {router.query.accountSlug && (
          <div className="mb-4 space-y-2">
            {/* <div className="-mx-2 flex items-center gap-1">
              <Button asChild variant="ghost" size="xs" className="text-muted-foreground">
                <Link href={`/preview/${router.query.accountSlug}/finances`}>Accounts</Link>
              </Button>
              <ChevronRight className="text-muted-foreground" size={16} />
              <Button asChild variant="ghost" size="xs" className="text-muted-foreground">
                <span>{data?.account?.name}</span>
              </Button>
            </div> */}
            {/* <Link
              href={`/preview/${router.query.accountSlug}/finances`}
              scroll={false}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <ArrowLeft size={16} /> Back to overview
            </Link> */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">{data?.account?.name} </h2>
                <Badge type="outline" className="bg-background">
                  {data?.account?.type === 'COLLECTIVE'
                    ? 'Main account'
                    : data?.account?.type === 'EVENT'
                      ? 'Event'
                      : 'Project'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">Submit expense</Button>
                <Button variant="outline" asChild>
                  <Link
                    href={
                      data?.account?.type === 'COLLECTIVE'
                        ? `/preview/${router.query.collectiveSlug}`
                        : data?.account?.type === 'EVENT'
                          ? `/preview/${router.query.collectiveSlug}/events/${router.query.accountSlug}`
                          : `/preview/${router.query.collectiveSlug}/projects/${router.query.accountSlug}`
                    }
                  >
                    Contribute
                  </Link>
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{data?.account.description}</p>
          </div>
        )}
        <Filterbar hideSeparator {...queryFilter} />

        <div className="overflow-hidden rounded-xl border bg-background">
          <div className="border-b">
            <div className="grid grid-flow-dense grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3">
              {metrics
                .filter(metric => !metric.hide)
                .map((metric, i) => (
                  <ProfileMetric
                    key={metric.id}
                    {...metric}
                    loading={loading}
                    active={metric.id === queryFilter.values.metric}
                    onClick={() => queryFilter.setFilter('metric', metric.id)}
                  />
                ))}
            </div>
          </div>

          <div className={clsx('relative h-[320px]')}>
            {metric.timeseries.current && <ComparisonChart expanded={true} {...metric.timeseries} />}
          </div>
        </div>
      </div>
      {router.query.accountSlug ? (
        <TransactionGroups />
      ) : (
        <AccountsList data={data} queryFilter={queryFilter} loading={loading} metric={metric} />
      )}
    </div>
  );
}

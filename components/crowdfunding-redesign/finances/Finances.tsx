import React from 'react';
import { useQuery } from '@apollo/client';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { TimeUnit } from '../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../lib/hooks/useQueryFilter';

import { childAccountFilter } from '../../dashboard/filters/ChildAccountFilter';
import { Filterbar } from '../../dashboard/filters/Filterbar';
import { periodCompareFilter } from '../../dashboard/filters/PeriodCompareFilter';
import { PeriodFilterCompare, PeriodFilterType } from '../../dashboard/filters/PeriodCompareFilter/schema';
import ComparisonChart from '../../dashboard/sections/overview/ComparisonChart';
import type { MetricProps } from '../../dashboard/sections/overview/Metric';
import Link from '../../Link';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import AccountsList from '../AccountsList';

import { financesQuery } from './common';
import { ProfileMetric } from './ProfileMetric';
import { TransactionGroups } from './TransactionGroups';

const schema = z.object({
  period: periodCompareFilter.schema.default({
    type: PeriodFilterType.ALL_TIME,
    compare: PeriodFilterCompare.NO_COMPARISON,
    timeUnit: TimeUnit.MONTH,
  }),
  as: z.string().optional(),
  account: childAccountFilter.schema,
  metric: z.coerce.string().nullable().default('balance'),
});

export function Finances({ inFundraiserLayout }: { inFundraiserLayout?: boolean }) {
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
              type: 'CREDIT',
            };

          case 'spent':
            return {
              ...include,
              includeSpent: true,
              includeReceivedTimeseries: true,
              type: 'DEBIT',
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

  const { data, loading, error } = useQuery(financesQuery, {
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

  return (
    <div className="relative mx-auto flex max-w-screen-lg flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        {router.query.accountSlug && !inFundraiserLayout && (
          <div className="mb-4 space-y-2">
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
                .map(metric => (
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
        <TransactionGroups queryFilter={queryFilter} />
      ) : (
        <AccountsList data={data} queryFilter={queryFilter} metric={metric} />
      )}
    </div>
  );
}

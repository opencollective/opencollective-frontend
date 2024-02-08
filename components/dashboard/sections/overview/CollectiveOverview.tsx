import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { getDashboardRoute } from '../../../../lib/url-helpers';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { childAccountFilter } from '../../filters/ChildAccountFilter';
import { Filterbar } from '../../filters/Filterbar';
import { periodCompareFilter } from '../../filters/PeriodCompareFilter';
import { DashboardSectionProps } from '../../types';

import { Accounts } from './Accounts';
import AccountTable from './AccountTable';
import { Metric, MetricProps } from './Metric';
import { overviewMetricsQuery } from './queries';
import { Timeline } from './Timeline';
import { TodoList } from './TodoList';

export const schema = z.object({
  period: periodCompareFilter.schema,
  as: z.string().optional(),
  account: childAccountFilter.schema,
  subpath: z.coerce.string().nullable().default(null), // default null makes sure to always trigger the `toVariables` function
});

export function CollectiveOverview({ accountSlug }: DashboardSectionProps) {
  const { account } = React.useContext(DashboardContext);
  const router = useRouter();
  const queryFilter = useQueryFilter({
    schema,
    toVariables: {
      period: periodCompareFilter.toVariables,
      account: childAccountFilter.toVariables,
      as: slug => ({ slug }),
      subpath: subpath => {
        const include = {
          includeReceived: false,
          includeReceivedTimeseries: false,
          includeBalance: false,
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
          case 'balance':
            return {
              ...include,
              includeBalance: true,
            };
          case 'spent':
            return {
              ...include,
              includeSpent: true,
            };
          case 'contributions':
            return {
              ...include,
              includeContributionsCount: true,
            };
          default:
            return {
              includeReceived: true,
              includeBalance: true,
              includeSpent: true,
              includeContributionsCount: true,
              includeReceivedTimeseries: true,
            };
        }
      },
    },
    filters: {
      period: periodCompareFilter.filter,
      account: childAccountFilter.filter,
    },
    meta: {
      accountSlug,
      childrenAccounts: account.childrenAccounts?.nodes ?? [],
    },
  });

  const { data, loading, error } = useQuery(overviewMetricsQuery, {
    variables: {
      slug: accountSlug,
      ...queryFilter.variables,
      ...(account.parent && { includeChildren: false }),
    },
    fetchPolicy: 'cache-first',
    context: API_V2_CONTEXT,
  });

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  const metrics: MetricProps[] = [
    {
      id: 'received',
      className: 'col-span-1 row-span-2',
      label: <FormattedMessage defaultMessage="Received" />,
      helpLabel: <FormattedMessage defaultMessage="Total amount received this period" />,
      amount: data?.account.received,
      timeseries: { ...data?.account.receivedTimeseries, currency: data?.account.received?.current?.currency },
      showCurrencyCode: true,
    },
    {
      id: 'spent',
      label: <FormattedMessage defaultMessage="Spent" />,
      helpLabel: <FormattedMessage defaultMessage="Total amount spent this period" />,
      amount: data?.account.spent,
    },
    {
      id: 'balance',
      label: <FormattedMessage id="Balance" defaultMessage="Balance" />,
      helpLabel: <FormattedMessage defaultMessage="Balance at end of this period, including starting balance" />,
      amount: data?.account.balance,
    },
    {
      id: 'contributions',
      label: <FormattedMessage id="Contributions" defaultMessage="Contributions" />,
      count: data?.account.contributionsCount,
    },
  ];

  if (queryFilter.values.subpath) {
    const metric = metrics.find(m => m.id === queryFilter.values.subpath);
    if (metric) {
      return (
        <div className="flex max-w-screen-lg flex-col gap-3">
          <DashboardHeader
            title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
            subpathTitle={metric.label}
            titleRoute={getDashboardRoute(account, 'overview')}
          />

          <Filterbar hideSeparator {...queryFilter} />

          <Metric
            label={metric.label}
            helpLabel={metric.helpLabel}
            amount={metric.amount}
            count={metric.count}
            timeseries={metric.timeseries}
            loading={loading}
            expanded
            showCurrencyCode
          >
            <AccountTable queryFilter={queryFilter} accountSlug={accountSlug} metric={metric} />
          </Metric>
        </div>
      );
    }
  }

  return (
    <div className="max-w-screen-lg space-y-6">
      <div className="flex flex-col gap-3">
        <DashboardHeader
          title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
          titleRoute={getDashboardRoute(account, 'overview')}
        />
        <Filterbar hideSeparator {...queryFilter} />

        <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3  ">
          {metrics.map(metric => (
            <Metric
              key={metric.id}
              {...metric}
              loading={loading}
              onClick={() => queryFilter.setFilter('subpath', metric.id)}
            />
          ))}
        </div>
      </div>

      <hr />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
        <div className="order-1 space-y-6 xl:order-none 2xl:col-span-2 ">
          <TodoList />
          <Timeline accountSlug={router.query?.as ?? accountSlug} />
        </div>
        {!account.parent && (
          <div className="-order-1 lg:order-none">
            <Accounts accountSlug={router.query?.as ?? accountSlug} />
          </div>
        )}
      </div>
    </div>
  );
}

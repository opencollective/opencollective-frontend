import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { Filterbar } from '../../filters/Filterbar';
import { DashboardSectionProps } from '../../types';

import { Balance } from './Balance';
import { Metric } from './Metric';
import { periodCompareFilter } from './PeriodCompareFilter';
import { collectiveOverviewQuery } from './queries';
import { Timeline } from './Timeline';
import { TodoList } from './TodoList';

export function CollectiveOverview({ accountSlug }: DashboardSectionProps) {
  const { account } = React.useContext(DashboardContext);
  const router = useRouter();
  const queryFilter = useQueryFilter({
    schema: z.object({
      period: periodCompareFilter.schema,
      as: z.string().optional(),
    }),
    toVariables: {
      period: periodCompareFilter.toVariables,
      as: slug => ({ slug }),
    },
    filters: {
      period: periodCompareFilter.filter,
    },
  });

  const { data, loading, error } = useQuery(collectiveOverviewQuery, {
    variables: {
      slug: accountSlug,
      ...queryFilter.variables,
      includeChildren: account.parent ? false : true,
    },
    context: API_V2_CONTEXT,
  });

  if (error) {
    return <div>{error.message}</div>;
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="order-1 flex flex-col gap-3 xl:col-span-2">
          <DashboardHeader title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />} />

          <Filterbar hideSeparator {...queryFilter} />
          <hr />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Metric
              label={<FormattedMessage defaultMessage="Received" />}
              amount={{ current: data?.account.stats.received, comparison: data?.account.stats.receivedComparison }}
              loading={loading}
            />
            <Metric
              label={<FormattedMessage defaultMessage="Spent" />}
              amount={{ current: data?.account.stats.spent, comparison: data?.account.stats.spentComparison }}
              loading={loading}
            />
            <Metric
              label={<FormattedMessage id="Contributions" defaultMessage="Contributions" />}
              count={{
                current: data?.account.stats.contributionsCount,
                comparison: data?.account.stats.contributionsCountComparison,
              }}
              loading={loading}
            />
          </div>

          <div className="mt-4">
            <Timeline accountSlug={router.query?.as ?? accountSlug} />
          </div>
        </div>
        <div className="order-first flex flex-col gap-4 md:order-last">
          <Balance
            loading={loading}
            mainAccount={data?.account}
            childrenAccounts={data?.account.childrenAccounts.nodes}
          />
          <TodoList account={data?.account} />
        </div>
      </div>
    </div>
  );
}

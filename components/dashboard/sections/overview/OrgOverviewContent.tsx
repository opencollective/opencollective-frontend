import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import dayjs from '@/lib/dayjs';
import { type HostOverviewMetricsQueryVariables } from '@/lib/graphql/types/v2/graphql';
import { i18nPeriodFilterType } from '@/lib/i18n/period-compare-filter';

import { columns } from '@/components/dashboard/sections/transactions/TransactionsTable';
import { DataTable } from '@/components/table/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';
import { DateFilterType } from '../../filters/DateFilter/schema';
import { Filterbar } from '../../filters/Filterbar';
import { periodFilter } from '../../filters/PeriodFilter';
import type { DashboardSectionProps } from '../../types';
import {
  schema as transactionsSchema,
  toVariables as transactionsToVariables,
} from '../transactions/AccountTransactions';

import type { MetricProps } from './Metric';
import { Metric } from './Metric';
import { orgOverviewMetricsQuery } from './queries';
import { Timeline } from './Timeline';

const schema = z.object({
  period: periodFilter.schema,
  as: z.string().optional(),
});

export function OrgOverviewContent({ accountSlug }: DashboardSectionProps) {
  const { account } = React.useContext(DashboardContext);
  const router = useRouter();
  const intl = useIntl();

  const queryFilter = useQueryFilter<typeof schema, HostOverviewMetricsQueryVariables>({
    schema,
    toVariables: {
      period: periodFilter.toVariables,
      as: slug => ({ slug }),
    },
    filters: {
      period: periodFilter.filter,
    },
  });

  const transactionsQueryFilter = useQueryFilter({
    schema: transactionsSchema,
    toVariables: transactionsToVariables,
    filters: {},
    skipRouter: true, // we don't want to update the URL (already done by the main query filter)
  });

  const { data, loading, error } = useQuery(orgOverviewMetricsQuery, {
    variables: {
      slug: accountSlug,
      ...queryFilter.variables,
    },
    fetchPolicy: 'cache-and-network',
    context: API_V2_CONTEXT,
  });

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  const metrics: MetricProps[] = [
    {
      id: 'received',
      label: <FormattedMessage defaultMessage="Received" id="z/wUXE" />,
      helpLabel: <FormattedMessage defaultMessage="Total amount received this period" id="2kY5p5" />,
      amount: data?.account.received,
    },
    {
      id: 'spent',
      label: <FormattedMessage defaultMessage="Spent" id="111qQK" />,
      helpLabel: <FormattedMessage defaultMessage="Total amount spent this period" id="6ctWuQ" />,
      amount: data?.account.spent,
    },
  ];

  return (
    <React.Fragment>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            <FormattedMessage defaultMessage="Recent Financial Activity" id="BAvsQv" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Filterbar hideSeparator {...queryFilter} />

          <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3">
            {metrics
              .filter(metric => !metric.hide)
              .map(metric => (
                <Metric key={metric.id} {...metric} loading={loading} />
              ))}
          </div>
          <div>
            <DataTable
              data-cy="transactions-table"
              innerClassName="table-fixed text-muted-foreground"
              columns={columns}
              data={data?.transactions?.nodes || []}
              loading={loading}
              nbPlaceholders={data?.account.transactions.limit || 5}
              mobileTableView
              columnVisibility={{ clearedAt: false, debit: false, credit: false }}
              getRowId={row => String(row.legacyId)}
              compact
              fullWidth={true}
            />
          </div>
          {loading ? (
            <div className="flex h-8 w-full items-center justify-center">
              <Skeleton className="h-5 w-40" />
            </div>
          ) : data?.account.transactions.totalCount > data?.account.transactions.limit ? (
            <Button
              size="xs"
              className="w-full"
              variant="ghost"
              onClick={() => {
                transactionsQueryFilter.resetFilters(
                  {
                    date: {
                      gte: dayjs(queryFilter.variables.dateFrom).format('YYYY-MM-DD'),
                      lte: dayjs(queryFilter.variables.dateTo).format('YYYY-MM-DD'),
                      type: DateFilterType.BETWEEN,
                    },
                  },
                  `/dashboard/${account.slug}/transactions`,
                );
              }}
            >
              <FormattedMessage
                defaultMessage="View {count} more transactions in {period}"
                id="GwHMxd"
                values={{
                  count: data.account.transactions.totalCount - data.account.transactions.limit,
                  period: intl.formatMessage(i18nPeriodFilterType[queryFilter.values.period.type]).toLowerCase(),
                }}
              />
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <div className="order-1 space-y-6 xl:order-none">
          <Timeline withTitle accountSlug={router.query?.as ?? accountSlug} />
        </div>
      </div>
    </React.Fragment>
  );
}

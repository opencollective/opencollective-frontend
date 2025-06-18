import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { getDashboardRoute } from '../../../../lib/url-helpers';
import dayjs from '@/lib/dayjs';
import type { HostOverviewMetricsQueryVariables } from '@/lib/graphql/types/v2/graphql';
import { formatDate } from '@/lib/utils';

import { columns } from '@/components/dashboard/sections/transactions/TransactionsTable';
import { DataTable } from '@/components/table/DataTable';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { DateFilterType } from '../../filters/DateFilter/schema';
import { Filterbar } from '../../filters/Filterbar';
import { hostContextFilter } from '../../filters/HostContextFilter';
import { periodFilter } from '../../filters/PeriodFilter';
import type { DashboardSectionProps } from '../../types';
import {
  schema as hostTransactionsSchema,
  toVariables as hostTransactionsToVariables,
} from '../transactions/HostTransactions';

import type { MetricProps } from './Metric';
import { Metric } from './Metric';
import { hostOverviewMetricsQuery } from './queries';
import { Timeline } from './Timeline';
import { HostTodoList } from './TodoList';

const schema = z.object({
  context: hostContextFilter.schema,
  period: periodFilter.schema,
  as: z.string().optional(),
});

export function HostOverview({ accountSlug }: DashboardSectionProps) {
  const { account } = React.useContext(DashboardContext);
  const [showSetupGuide, setShowSetupGuide] = React.useState(false);
  const router = useRouter();
  const queryFilter = useQueryFilter<typeof schema, HostOverviewMetricsQueryVariables>({
    schema,
    toVariables: {
      period: periodFilter.toVariables,
      context: value => {
        switch (value) {
          case 'ALL':
            return {
              includeOrgStats: false,
            };
          case 'ORGANIZATION':
            return {
              includeOrgStats: true,
              transactionsForAccount: {
                slug: account.slug,
              },
            };
          case 'HOSTED':
            return {
              includeOrgStats: true,
              excludeTransactionsForAccount: {
                slug: account.slug,
              },
            };
        }
      },
      as: slug => ({ slug }),
    },
    filters: {
      context: hostContextFilter.filter,
      period: periodFilter.filter,
    },
  });

  const hostTransactionsQueryFilter = useQueryFilter({
    schema: hostTransactionsSchema,
    toVariables: hostTransactionsToVariables,
    filters: {},
    skipRouter: true, // we don't want to update the URL (already done by the main query filter)
  });

  const { data, loading, error } = useQuery(hostOverviewMetricsQuery, {
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
      id: 'openingBalance',
      label: <FormattedMessage defaultMessage="Opening Balance" id="xHJK6V" />,
      helpLabel: (
        <FormattedMessage
          defaultMessage="As of {date}"
          id="fnHxpp"
          values={{ date: formatDate(queryFilter.variables.dateFrom, { dateStyle: 'full', timeStyle: 'long' }) }}
        />
      ),
      amount: {
        // TODO: Add API support for host context filtering to not have to make this calculation in the frontend
        current:
          queryFilter.values.context === 'ALL'
            ? data?.host.allOpeningBalance.totalMoneyManaged
            : queryFilter.values.context === 'ORGANIZATION'
              ? data?.host.orgStats.openingBalance
              : {
                  ...data?.host.allOpeningBalance.totalMoneyManaged,
                  valueInCents:
                    data?.host.allOpeningBalance.totalMoneyManaged.valueInCents -
                    data?.host.orgStats.openingBalance.valueInCents,
                },
      },
    },
    {
      id: 'closingBalance',
      label: <FormattedMessage defaultMessage="Closing Balance" id="JWu/xI" />,
      helpLabel: (
        <FormattedMessage
          defaultMessage="As of {date}"
          id="fnHxpp"
          values={{ date: formatDate(queryFilter.variables.dateTo, { dateStyle: 'full', timeStyle: 'long' }) }}
        />
      ),
      amount: {
        // TODO: Add API support for host context filtering to not have to make this calculation in the frontend
        current:
          queryFilter.values.context === 'ALL'
            ? data?.host.allClosingBalance.totalMoneyManaged
            : queryFilter.values.context === 'ORGANIZATION'
              ? data?.host.orgStats.closingBalance
              : {
                  ...data?.host.allClosingBalance.totalMoneyManaged,
                  valueInCents:
                    data?.host.allClosingBalance.totalMoneyManaged.valueInCents -
                    data?.host.orgStats.closingBalance.valueInCents,
                },
      },
    },
  ];

  return (
    <div className="max-w-(--breakpoint-lg) space-y-6">
      <div className="flex flex-col gap-3">
        <DashboardHeader
          title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
          titleRoute={getDashboardRoute(account, 'overview')}
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowSetupGuide(open => !open);
              }}
            >
              {showSetupGuide ? (
                <FormattedMessage defaultMessage="Hide setup guide" id="SetupGuide.HideSetupGuide" />
              ) : (
                <FormattedMessage defaultMessage="Show setup guide" id="SetupGuide.ShowSetupGuide" />
              )}
            </Button>
          }
        />
        <Collapsible open={showSetupGuide}>
          <CollapsibleContent>
            <Card>
              <CardHeader>
                <CardTitle>
                  <FormattedMessage defaultMessage="Setup guide" id="SetupGuide.Title" />
                </CardTitle>
                <CardDescription>Get going with Open Collective!</CardDescription>
              </CardHeader>
              {/* <CardContent>TBD</CardContent> */}
            </Card>
          </CollapsibleContent>
        </Collapsible>
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
            nbPlaceholders={data?.transactions.limit || 5}
            mobileTableView
            columnVisibility={{ clearedAt: false, debit: false, credit: false }}
            getRowId={row => String(row.legacyId)}
            compact
          />
        </div>
        {loading ? (
          <div className="h-8" />
        ) : (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              hostTransactionsQueryFilter.resetFilters(
                {
                  ...(queryFilter.values.context === 'ORGANIZATION'
                    ? {
                        account: account.slug,
                      }
                    : queryFilter.values.context === 'HOSTED'
                      ? {
                          excludeAccount: account.slug,
                        }
                      : {}),
                  date: {
                    gte: dayjs(queryFilter.variables.dateFrom).format('YYYY-MM-DD'),
                    lte: dayjs(queryFilter.variables.dateTo).format('YYYY-MM-DD'),
                    type: DateFilterType.BETWEEN,
                  },
                },
                `/dashboard/${account.slug}/host-transactions`,
              );
            }}
          >
            <FormattedMessage
              defaultMessage="View {count} more transactions"
              id="VKGqF7"
              values={{ count: data.transactions.totalCount - data.transactions.limit }}
            />
          </Button>
        )}
      </div>

      <hr />

      <div className="grid grid-cols-1 gap-6">
        <div className="order-1 space-y-6 xl:order-none">
          <HostTodoList />
          <Timeline accountSlug={router.query?.as ?? accountSlug} />
        </div>
      </div>
    </div>
  );
}

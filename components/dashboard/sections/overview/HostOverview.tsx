import React from 'react';
import { useQuery } from '@apollo/client';
import { ArrowRight, Settings } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { hasAccountMoneyManagement, isHeavyAccount } from '@/lib/collective';
import dayjs from '@/lib/dayjs';
import { HostContext, type HostOverviewMetricsQueryVariables } from '@/lib/graphql/types/v2/graphql';
import { i18nPeriodFilterType } from '@/lib/i18n/period-compare-filter';

import { columns } from '@/components/dashboard/sections/transactions/TransactionsTable';
import { DataTable } from '@/components/table/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Skeleton } from '@/components/ui/Skeleton';

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

import { ConvertedAccountMessage } from './ConvertedAccountMessage';
import type { MetricProps } from './Metric';
import { Metric } from './Metric';
import { PlatformBillingCollapsibleCard } from './PlatformBillingOverviewCard';
import { hostOverviewMetricsQuery } from './queries';
import { Timeline } from './Timeline';
import { HostTodoList } from './TodoList';
import { useSetupGuide } from './useSetupGuide';
import { WelcomeOrganization } from './Welcome';

const schema = z.object({
  context: hostContextFilter.schema,
  period: periodFilter.schema,
  as: z.string().optional(),
});

export function HostOverview({ accountSlug }: DashboardSectionProps) {
  const { account } = React.useContext(DashboardContext);
  const router = useRouter();
  const intl = useIntl();
  const [showSetupGuide, handleSetupGuideToggle] = useSetupGuide();

  const hasMoneyManagement = hasAccountMoneyManagement(account);

  const queryFilter = useQueryFilter<typeof schema, HostOverviewMetricsQueryVariables>({
    schema,
    toVariables: {
      period: periodFilter.toVariables,
      context: hostContext => {
        if (hostContext === HostContext.HOSTED) {
          return {
            hostContext,
            excludeTransactionsForAccount: {
              slug: accountSlug,
            },
          };
        } else if (hostContext === HostContext.INTERNAL) {
          return {
            hostContext,
            transactionsForAccount: {
              slug: accountSlug,
            },
          };
        } else {
          return { hostContext };
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
      includeComparison: !isHeavyAccount(accountSlug),
      ...queryFilter.variables,
    },
    fetchPolicy: 'cache-and-network',
  });

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  const metrics: MetricProps[] = [
    {
      id: 'balance',
      label: <FormattedMessage id="Balance" defaultMessage="Balance" />,
      helpLabel: (
        <FormattedMessage defaultMessage="Balance at end of this period, including starting balance" id="hi/nhW" />
      ),
      amount: {
        current: data?.host.hostStats.balance,
        comparison: data?.host.hostStats.comparisonBalance,
      },
    },
    {
      id: 'received',
      label: <FormattedMessage defaultMessage="Received" id="z/wUXE" />,
      helpLabel: <FormattedMessage defaultMessage="Total amount received this period" id="2kY5p5" />,
      amount: {
        current: data?.host.hostStats.totalAmountReceived,
      },
    },
    {
      id: 'spent',
      label: <FormattedMessage defaultMessage="Spent" id="111qQK" />,
      helpLabel: <FormattedMessage defaultMessage="Total amount spent this period" id="6ctWuQ" />,
      amount: {
        current: data?.host.hostStats.totalAmountSpent,
      },
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="outline">
                <Settings size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={showSetupGuide}
                onClick={() => handleSetupGuideToggle(!showSetupGuide)}
              >
                <FormattedMessage defaultMessage="Display setup guide" id="SetupGuide.DisplaySetupGuide" />
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <ConvertedAccountMessage account={account} />
      <WelcomeOrganization account={account} open={showSetupGuide} setOpen={handleSetupGuideToggle} />
      {hasMoneyManagement && account.platformSubscription && <PlatformBillingCollapsibleCard />}

      <HostTodoList />

      <Card className="pb-3">
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
              nbPlaceholders={data?.transactions.limit || 5}
              mobileTableView
              columnVisibility={{ clearedAt: false, debit: false, credit: false }}
              getRowId={row => String(row.legacyId)}
              compact
            />
          </div>
          {loading ? (
            <div className="flex h-10 w-full items-center justify-center">
              <Skeleton className="h-5 w-40" />
            </div>
          ) : data.transactions.totalCount > data.transactions.limit ? (
            <div className="flex justify-center">
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => {
                  const hostContext =
                    queryFilter.values.context === HostContext.INTERNAL
                      ? {
                          account: account.slug,
                        }
                      : queryFilter.values.context === HostContext.HOSTED
                        ? {
                            excludeAccount: account.slug,
                          }
                        : {};
                  hostTransactionsQueryFilter.resetFilters(
                    {
                      ...hostContext,
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
                  defaultMessage="View {count} more transactions in {period}"
                  id="GwHMxd"
                  values={{
                    count: data.transactions.totalCount - data.transactions.limit,
                    period: intl.formatMessage(i18nPeriodFilterType[queryFilter.values.period.type]).toLowerCase(),
                  }}
                />{' '}
                <ArrowRight size={14} />
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <div className="order-1 space-y-6 xl:order-none">
          <Timeline withTitle accountSlug={router.query?.as ?? accountSlug} />
        </div>
      </div>
    </div>
  );
}

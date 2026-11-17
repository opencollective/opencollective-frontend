import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { limit, offset } from '@/lib/filters/schemas';
import { TransactionType } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import formatCollectiveType from '@/lib/i18n/collective-type';
import { i18nPeriodFilterType } from '@/lib/i18n/period-compare-filter';

import { formatPeriod } from '../../filters/PeriodCompareFilter';
import { PeriodFilterType } from '../../filters/PeriodCompareFilter/schema';
import { periodFilter } from '../../filters/PeriodFilter';
import { Metric } from '../overview/Metric';
import { transactionsTableQuery } from '../transactions/queries';
import type { TransactionsTableProps } from '../transactions/TransactionsTable';
import TransactionsTable from '../transactions/TransactionsTable';

import { AccountDetailView, type MoneyMovementsView } from './common';
import {
  HostedAccountBalanceSummary,
  type HostedAccountOverviewFilter,
  hostedAccountOverviewFilterSchema,
} from './HostedAccountBalanceSummary';
import { type HostedAccountDetailData, hostedAccountFinancialOverviewQuery } from './queries';

/** Card title with the period the amount/graph refers to, e.g. "Last 4 weeks". */
const MetricLabel = ({ children, period }: { children: React.ReactNode; period: string }) => (
  <span className="block">
    <span className="block">{children}</span>
    <span className="block text-xs font-normal text-muted-foreground">{period}</span>
  </span>
);

const recentTransactionsSchema = z.object({
  limit: limit.default(5),
  offset,
  openTransactionId: z.coerce.string().optional(),
});

type HostedFinancialSummaryCardProps = {
  account?: HostedAccountDetailData;
  hostSlug: string;
  handleTabChange: (tab: string, view?: MoneyMovementsView) => void;
  handleTransactionTableRowClick: TransactionsTableProps['onClickRow'];
};

export function HostedFinancialSummaryCard({
  account,
  hostSlug,
  handleTabChange,
  handleTransactionTableRowClick,
}: HostedFinancialSummaryCardProps) {
  const intl = useIntl();
  const name = account?.name || account?.legalName || account?.slug || formatCollectiveType(intl, account?.type);

  // The period filter lives here so it can scope the balance card and both charts below.
  const queryFilter: HostedAccountOverviewFilter = useQueryFilter({
    schema: hostedAccountOverviewFilterSchema,
    toVariables: { period: periodFilter.toVariables },
    defaultFilterValues: {
      period: { type: PeriodFilterType.ALL_TIME },
    },
    filters: { period: periodFilter.filter },
    skipRouter: true,
  });

  const overviewQuery = useQuery(hostedAccountFinancialOverviewQuery, {
    variables: { accountId: account?.id, ...queryFilter.variables },
    skip: !account?.id,
    fetchPolicy: 'cache-and-network',
  });

  const stats = overviewQuery.data?.account?.stats;
  const loading = overviewQuery.loading && !stats;

  // The received/disbursed cards sit below the balance card that owns the filter,
  // so they spell out the period they are scoped to.
  const period = queryFilter.values.period;
  const periodLabel =
    period.type === PeriodFilterType.CUSTOM
      ? formatPeriod({ from: period.gte, to: period.lte }) || intl.formatMessage(i18nPeriodFilterType[period.type])
      : intl.formatMessage(i18nPeriodFilterType[period.type]);

  const recentCreditsQueryFilter = useQueryFilter({
    schema: recentTransactionsSchema,
    filters: {},
    skipRouter: true,
  });

  const recentDebitsQueryFilter = useQueryFilter({
    schema: recentTransactionsSchema,
    filters: {},
    skipRouter: true,
  });

  // Hosted accounts read transactions where the account is either side.
  const recentCreditsQuery = useQuery(transactionsTableQuery, {
    variables: {
      account: [{ id: account?.id }],
      hostAccount: { slug: hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: false,
      sort: { field: 'CREATED_AT', direction: 'DESC' },
      limit: 5,
      offset: 0,
      type: TransactionType.CREDIT,
    },
    skip: !account?.id || !hostSlug,
    notifyOnNetworkStatusChange: true,
  });

  const recentDebitsQuery = useQuery(transactionsTableQuery, {
    variables: {
      account: [{ id: account?.id }],
      hostAccount: { slug: hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: false,
      sort: { field: 'CREATED_AT', direction: 'DESC' },
      limit: 5,
      offset: 0,
      type: TransactionType.DEBIT,
    },
    skip: !account?.id || !hostSlug,
    notifyOnNetworkStatusChange: true,
  });

  const recentCredits = recentCreditsQuery.data?.transactions;
  const recentDebits = recentDebitsQuery.data?.transactions;

  return (
    <React.Fragment>
      <HostedAccountBalanceSummary
        account={account}
        stats={stats}
        queryFilter={queryFilter}
        onOpenMoneyView={view => handleTabChange(AccountDetailView.MONEY_MOVEMENTS, view)}
      />
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Metric
            className="order-1 xl:order-1"
            label={
              <MetricLabel period={periodLabel}>
                <FormattedMessage defaultMessage="Received by {name}" id="ReceivedBy" values={{ name }} />
              </MetricLabel>
            }
            loading={loading}
            showTimeSeries
            expanded
            amount={{ current: stats?.consolidatedTotalNetAmountRaised }}
            timeseries={
              stats?.receivedTimeSeries
                ? {
                    current: stats.receivedTimeSeries,
                    currency: stats.receivedTimeSeries?.nodes[0]?.amount?.currency,
                  }
                : undefined
            }
          />
          <Metric
            className="order-3 xl:order-2"
            label={
              <MetricLabel period={periodLabel}>
                <FormattedMessage defaultMessage="Disbursed by {name}" id="DisbursedBy" values={{ name }} />
              </MetricLabel>
            }
            loading={loading}
            showTimeSeries
            expanded
            amount={{ current: stats?.consolidatedTotalAmountSpent }}
            color="#dc2626"
            timeseries={
              stats?.disbursedTimeSeries
                ? {
                    current: stats.disbursedTimeSeries,
                    currency: stats.disbursedTimeSeries?.nodes[0]?.amount?.currency,
                  }
                : undefined
            }
          />
          <div className="order-2 flex flex-col gap-2 xl:order-3">
            <h3 className="text-sm font-medium text-slate-800">
              <FormattedMessage defaultMessage="Recently Received" id="RecentlyReceived" />
            </h3>
            <TransactionsTable
              transactions={recentCredits}
              loading={recentCreditsQuery.loading}
              nbPlaceholders={5}
              queryFilter={recentCreditsQueryFilter}
              refetchList={recentCreditsQuery.refetch}
              hideHeader
              hidePagination
              meta={{
                timeStyle: null,
              }}
              onClickRow={handleTransactionTableRowClick}
              columns={['date', 'account', 'amount', 'currency']}
              footer={
                recentCredits?.nodes?.length > 0 && (
                  <div className="flex min-h-[49px] w-full items-center justify-center border-t">
                    <button
                      onClick={() => handleTabChange(AccountDetailView.MONEY_MOVEMENTS, 'CONTRIBUTIONS')}
                      className="font-normal text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <FormattedMessage defaultMessage="View more" id="34Up+l" />
                    </button>
                  </div>
                )
              }
            />
          </div>
          <div className="order-4 flex flex-col gap-2 xl:order-4">
            <h3 className="text-sm font-medium text-slate-800">
              <FormattedMessage defaultMessage="Recently Disbursed" id="RecentlyDisbursed" />
            </h3>
            <TransactionsTable
              transactions={recentDebits}
              loading={recentDebitsQuery.loading}
              nbPlaceholders={5}
              queryFilter={recentDebitsQueryFilter}
              refetchList={recentDebitsQuery.refetch}
              hideHeader
              hidePagination
              meta={{
                timeStyle: null,
              }}
              onClickRow={handleTransactionTableRowClick}
              columns={['date', 'account', 'amount', 'currency']}
              footer={
                recentDebits?.nodes?.length > 0 && (
                  <div className="flex min-h-[49px] w-full items-center justify-center border-t">
                    <button
                      onClick={() => handleTabChange(AccountDetailView.MONEY_MOVEMENTS, 'PAYOUTS')}
                      className="font-normal text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <FormattedMessage defaultMessage="View more" id="34Up+l" />
                    </button>
                  </div>
                )
              }
            />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

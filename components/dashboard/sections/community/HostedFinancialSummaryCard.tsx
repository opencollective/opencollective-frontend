import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { limit, offset } from '@/lib/filters/schemas';
import { TransactionType } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import formatCollectiveType from '@/lib/i18n/collective-type';

import { Metric } from '../overview/Metric';
import { transactionsTableQuery } from '../transactions/queries';
import type { TransactionsTableProps } from '../transactions/TransactionsTable';
import TransactionsTable from '../transactions/TransactionsTable';

import { AccountDetailView } from './common';
import { HostedAccountBalanceSummary } from './HostedAccountBalanceSummary';
import type { AccountDetailData } from './queries';

const recentTransactionsSchema = z.object({
  limit: limit.default(5),
  offset,
  openTransactionId: z.coerce.string().optional(),
});

type HostedFinancialSummaryCardProps = {
  account?: AccountDetailData;
  hostSlug: string;
  loading: boolean;
  handleTabChange: (tab: string) => void;
  handleTransactionTableRowClick: TransactionsTableProps['onClickRow'];
};

export function HostedFinancialSummaryCard({
  account,
  hostSlug,
  loading,
  handleTabChange,
  handleTransactionTableRowClick,
}: HostedFinancialSummaryCardProps) {
  const intl = useIntl();
  const name = account?.name || account?.legalName || account?.slug || formatCollectiveType(intl, account?.type);
  const stats = account?.stats;

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
        onOpenMoneyView={() => handleTabChange(AccountDetailView.PAYMENT_INTENTS)}
      />
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Metric
            className="order-1 xl:order-1"
            label={<FormattedMessage defaultMessage="Received by {name}" id="ReceivedBy" values={{ name }} />}
            loading={loading}
            amount={{ current: stats?.consolidatedTotalNetAmountRaised }}
          />
          <Metric
            className="order-3 xl:order-2"
            label={<FormattedMessage defaultMessage="Disbursed by {name}" id="DisbursedBy" values={{ name }} />}
            loading={loading}
            amount={{ current: stats?.consolidatedTotalAmountSpent }}
            color="#dc2626"
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
                      onClick={() => handleTabChange(AccountDetailView.TRANSACTIONS)}
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
                      onClick={() => handleTabChange(AccountDetailView.TRANSACTIONS)}
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

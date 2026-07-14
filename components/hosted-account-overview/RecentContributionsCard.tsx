import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { limit as limitFilter, offset } from '@/lib/filters/schemas';
import { TransactionKind, TransactionType } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';

import { transactionsTableQuery } from '@/components/dashboard/sections/transactions/queries';
import type { TransactionsTableProps } from '@/components/dashboard/sections/transactions/TransactionsTable';

import { type RecentPaymentIntentRow, RecentPaymentIntentsCard } from './RecentPaymentIntentsCard';
import { RecentTransactionsCard } from './RecentTransactionsCard';

const RECENT_LIMIT = 5;

const recentTransactionsSchema = z.object({
  limit: limitFilter.default(RECENT_LIMIT),
  offset,
  openTransactionId: z.coerce.string().optional(),
});

const recentContributionsPaymentIntentsQuery = gql`
  query RecentContributionsPaymentIntents(
    $account: AccountReferenceInput!
    $host: AccountReferenceInput!
    $limit: Int!
  ) {
    paymentIntents(
      account: $account
      host: $host
      direction: INCOMING
      includeChildrenPaymentIntents: true
      type: [Contribution, AddedMoney]
      limit: $limit
    ) {
      totalCount
      nodes {
        id
        publicId
        status
        createdAt
        paidAt
        description
        payer {
          id
          publicId
          slug
          name
          imageUrl
          type
          isIncognito
        }
        payee {
          id
          publicId
          slug
          name
          type
        }
        amountReceived(currencySource: HOST) {
          valueInCents
          currency
        }
        amountPledged(currencySource: HOST) {
          valueInCents
          currency
        }
        order {
          id
          publicId
          legacyId
        }
        expense {
          id
          publicId
          legacyId
        }
      }
    }
  }
`;

type RecentContributionsCardProps = {
  account?: { id?: string } | null;
  hostSlug: string;
  onRowClick: TransactionsTableProps['onClickRow'];
  onViewAll: () => void;
};

export function RecentContributionsCard({ account, hostSlug, onRowClick, onViewAll }: RecentContributionsCardProps) {
  const { LoggedInUser } = useLoggedInUser();
  const usePaymentIntents = Boolean(
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.PAYMENT_INTENT_IN_HOSTED_ACCOUNT_OVERVIEW),
  );
  const queryFilter = useQueryFilter({ schema: recentTransactionsSchema, filters: {}, skipRouter: true });

  const transactionsQuery = useQuery(transactionsTableQuery, {
    variables: {
      account: [{ id: account?.id }],
      hostAccount: { slug: hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: true,
      sort: { field: 'CREATED_AT', direction: 'DESC' },
      limit: RECENT_LIMIT,
      offset: 0,
      type: TransactionType.CREDIT,
      kind: [TransactionKind.CONTRIBUTION, TransactionKind.ADDED_FUNDS],
    },
    skip: !account?.id || usePaymentIntents,
    notifyOnNetworkStatusChange: true,
  });

  const paymentIntentsQuery = useQuery(recentContributionsPaymentIntentsQuery, {
    variables: {
      account: { id: account?.id },
      host: { slug: hostSlug },
      limit: RECENT_LIMIT,
    },
    skip: !account?.id || !usePaymentIntents,
    notifyOnNetworkStatusChange: true,
  });

  const title = <FormattedMessage defaultMessage="Recent Contributions" id="BPg/ek" />;

  if (usePaymentIntents) {
    const rows: RecentPaymentIntentRow[] = (paymentIntentsQuery.data?.paymentIntents?.nodes ?? []).map((pi: any) => ({
      id: pi.id,
      date: pi.paidAt || pi.createdAt,
      from: pi.payer,
      to: pi.payee,
      status: pi.status,
      amount: pi.amountReceived ?? pi.amountPledged ?? null,
    }));
    return (
      <RecentPaymentIntentsCard title={title} rows={rows} loading={paymentIntentsQuery.loading} onViewAll={onViewAll} />
    );
  }

  return (
    <RecentTransactionsCard
      title={title}
      transactions={transactionsQuery.data?.transactions}
      loading={transactionsQuery.loading}
      queryFilter={queryFilter}
      refetch={transactionsQuery.refetch}
      onRowClick={onRowClick}
      onViewAll={onViewAll}
    />
  );
}

import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { type RecentPaymentIntentRow, RecentPaymentIntentsCard } from './RecentPaymentIntentsCard';

const RECENT_LIMIT = 5;

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
      }
    }
  }
`;

type RecentContributionsCardProps = {
  account?: { id?: string } | null;
  hostSlug: string;
  onViewAll: () => void;
};

export function RecentContributionsCard({ account, hostSlug, onViewAll }: RecentContributionsCardProps) {
  const paymentIntentsQuery = useQuery(recentContributionsPaymentIntentsQuery, {
    variables: {
      account: { id: account?.id },
      host: { slug: hostSlug },
      limit: RECENT_LIMIT,
    },
    skip: !account?.id,
    notifyOnNetworkStatusChange: true,
  });

  const rows: RecentPaymentIntentRow[] = (paymentIntentsQuery.data?.paymentIntents?.nodes ?? []).map((pi: any) => ({
    id: pi.id,
    date: pi.paidAt || pi.createdAt,
    from: pi.payer,
    to: pi.payee,
    status: pi.status,
    amount: pi.amountReceived ?? pi.amountPledged ?? null,
  }));

  return (
    <RecentPaymentIntentsCard
      title={<FormattedMessage defaultMessage="Recent Contributions" id="BPg/ek" />}
      rows={rows}
      loading={paymentIntentsQuery.loading}
      onViewAll={onViewAll}
    />
  );
}

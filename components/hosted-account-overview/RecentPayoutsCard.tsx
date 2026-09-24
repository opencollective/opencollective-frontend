import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { type RecentPaymentIntentRow, RecentPaymentIntentsCard } from './RecentPaymentIntentsCard';

const RECENT_LIMIT = 5;

const recentPayoutsPaymentIntentsQuery = gql`
  query RecentPayoutsPaymentIntents($account: AccountReferenceInput!, $host: AccountReferenceInput!, $limit: Int!) {
    paymentIntents(
      account: $account
      host: $host
      direction: OUTGOING
      includeChildrenPaymentIntents: true
      type: [PaymentRequest, GrantRequest, CardCharge]
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
          type
        }
        payee {
          id
          publicId
          slug
          name
          imageUrl
          type
          isIncognito
        }
        amountSent(currencySource: HOST) {
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

type RecentPayoutsCardProps = {
  account?: { id?: string } | null;
  hostSlug: string;
  onViewAll: () => void;
};

export function RecentPayoutsCard({ account, hostSlug, onViewAll }: RecentPayoutsCardProps) {
  const paymentIntentsQuery = useQuery(recentPayoutsPaymentIntentsQuery, {
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
    amount: pi.amountSent ?? pi.amountPledged ?? null,
  }));

  return (
    <RecentPaymentIntentsCard
      title={<FormattedMessage defaultMessage="Recent Payouts" id="aS3BD9" />}
      rows={rows}
      loading={paymentIntentsQuery.loading}
      onViewAll={onViewAll}
    />
  );
}

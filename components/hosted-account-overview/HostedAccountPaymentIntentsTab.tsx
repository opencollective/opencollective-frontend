import React from 'react';
import { useQuery } from '@apollo/client';
import { useIntl } from 'react-intl';

import type { AccountPaymentIntentsQueryVariables } from '@/lib/graphql/types/v2/graphql';
import { PaymentIntentDirection, PaymentIntentType } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import { EmptyResults } from '@/components/dashboard/EmptyResults';
import { Filterbar } from '@/components/dashboard/filters/Filterbar';
import { filters, schema, toVariables } from '@/components/dashboard/sections/payment-intents/filters';
import PaymentIntentsTable from '@/components/dashboard/sections/payment-intents/PaymentIntentsTable';
import {
  accountPaymentIntentsCountsQuery,
  accountPaymentIntentsQuery,
} from '@/components/dashboard/sections/payment-intents/queries';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';

import type { HostedAccountProfileData, MoneyMovementsView } from './types';

type HostedAccountPaymentIntentsTabProps = {
  account?: HostedAccountProfileData;
  hostSlug: string;
  initialView?: MoneyMovementsView;
};

export function HostedAccountPaymentIntentsTab({
  account,
  hostSlug,
  initialView,
}: HostedAccountPaymentIntentsTabProps) {
  const intl = useIntl();

  // Same Contributions / Payouts split as the Money Movements tab, expressed in payment-intent terms so
  // "view all" from the overview cards lands on the matching view.
  const views = React.useMemo(
    () => [
      { id: 'ALL', label: intl.formatMessage({ defaultMessage: 'All', id: 'All' }), filter: {} },
      {
        id: 'CONTRIBUTIONS',
        label: intl.formatMessage({ defaultMessage: 'Contributions', id: 'Contributions' }),
        filter: {
          direction: PaymentIntentDirection.INCOMING,
          type: [PaymentIntentType.Contribution, PaymentIntentType.AddedMoney],
        },
      },
      {
        id: 'PAYOUTS',
        label: intl.formatMessage({ defaultMessage: 'Payouts', id: 'Payouts' }),
        filter: {
          direction: PaymentIntentDirection.OUTGOING,
          type: [PaymentIntentType.PaymentRequest, PaymentIntentType.GrantRequest, PaymentIntentType.CardCharge],
        },
      },
    ],
    [intl],
  );

  const defaultFilterValues = React.useMemo(
    () => views.find(view => view.id === initialView)?.filter,
    [views, initialView],
  );

  const queryFilter = useQueryFilter<typeof schema, AccountPaymentIntentsQueryVariables>({
    schema,
    toVariables,
    filters,
    views,
    defaultFilterValues,
    meta: { accountSlug: account?.slug },
  });

  const { data, error, loading } = useQuery(accountPaymentIntentsQuery, {
    variables: {
      account: { id: account?.id },
      host: { slug: hostSlug },
      includeChildrenPaymentIntents: true,
      ...queryFilter.variables,
    },
    skip: !account?.id,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const { data: counts } = useQuery(accountPaymentIntentsCountsQuery, {
    variables: { account: { id: account?.id }, host: { slug: hostSlug } },
    skip: !account?.id,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const paymentIntents = data?.paymentIntents;

  const viewsWithCount = views.map(view => ({
    ...view,
    count:
      view.id === 'ALL'
        ? counts?.all?.totalCount
        : view.id === 'CONTRIBUTIONS'
          ? counts?.contributions?.totalCount
          : counts?.payouts?.totalCount,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Filterbar {...queryFilter} views={viewsWithCount} />

      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !paymentIntents?.nodes?.length ? (
        <EmptyResults
          entityType="TRANSACTIONS"
          hasFilters={queryFilter.hasFilters}
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <PaymentIntentsTable
          paymentIntents={paymentIntents}
          loading={loading}
          nbPlaceholders={queryFilter.values.limit}
          queryFilter={queryFilter}
        />
      )}
    </div>
  );
}

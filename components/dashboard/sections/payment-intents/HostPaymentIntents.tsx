import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import type { HostPaymentIntentsQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import { HostContextFilter } from '../../filters/HostContextFilter';
import type { DashboardSectionProps } from '../../types';

import { filters, schema, toVariables } from './filters';
import PaymentIntentsTable from './PaymentIntentsTable';
import { hostPaymentIntentsQuery } from './queries';

const HostPaymentIntents = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const intl = useIntl();

  const queryFilter = useQueryFilter<typeof schema, HostPaymentIntentsQueryVariables>({
    schema,
    toVariables,
    filters,
    meta: { hostSlug },
    skipFiltersOnReset: ['hostContext'],
  });

  const { data, error, loading } = useQuery(hostPaymentIntentsQuery, {
    variables: {
      host: { slug: hostSlug },
      includeChildrenPaymentIntents: true,
      ...queryFilter.variables,
    },
    fetchPolicy: 'cache-and-network',
  });

  const paymentIntents = data?.paymentIntents;

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={
          <div className="flex flex-1 flex-wrap items-center justify-between gap-4">
            <FormattedMessage defaultMessage="Payment Intents" id="PaymentIntents" />
            <HostContextFilter
              value={queryFilter.values.hostContext}
              onChange={val => queryFilter.setFilter('hostContext', val)}
              intl={intl}
            />
          </div>
        }
        description={
          <FormattedMessage
            defaultMessage="All payment intents flowing through your fiscal host"
            id="PaymentIntents.Description"
          />
        }
      />

      <Filterbar {...queryFilter} />

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
};

export default HostPaymentIntents;

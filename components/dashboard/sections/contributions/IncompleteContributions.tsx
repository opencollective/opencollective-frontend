import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { hasAccountHosting } from '@/lib/collective';
import { ExpectedFundsFilter } from '@/lib/graphql/types/v2/graphql';

import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { HostContextFilter, hostContextFilter } from '../../filters/HostContextFilter';
import type { DashboardSectionProps } from '../../types';

import ContributionsTable from './ContributionsTable';
import type { FilterMeta } from './filters';
import { ContributionAccountingCategoryKinds, filters, schema as baseSchema, toVariables } from './filters';
import { dashboardOrdersQuery } from './queries';

const schema = baseSchema.extend({ hostContext: hostContextFilter.schema });

export default function IncompleteContributions({ accountSlug }: DashboardSectionProps) {
  const intl = useIntl();
  const { account } = useContext(DashboardContext);

  const filterMeta: FilterMeta = {
    currency: account.currency,
    accountSlug: account.slug,
    hostSlug: account.isHost ? account.slug : undefined,
    includeUncategorized: true,
    accountingCategoryKinds: ContributionAccountingCategoryKinds,
  };

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    meta: filterMeta,
    filters,
    skipFiltersOnReset: ['hostContext'],
  });

  const hasHosting = hasAccountHosting(account);

  const { data, loading, error, refetch } = useQuery(dashboardOrdersQuery, {
    variables: {
      slug: accountSlug,
      filter: 'INCOMING',
      includeIncognito: true,
      expectedFundsFilter: ExpectedFundsFilter.ONLY_MANUAL,
      ...queryFilter.variables,
    },

    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const orders = data?.account?.orders ?? { nodes: [], totalCount: 0 };
  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={
          <div className="flex flex-1 flex-wrap items-center justify-between gap-4">
            <FormattedMessage id="IncompleteContributions" defaultMessage="Incomplete Contributions" />
            {hasHosting && (
              <HostContextFilter
                value={queryFilter.values.hostContext}
                onChange={val => queryFilter.setFilter('hostContext', val)}
                intl={intl}
              />
            )}
          </div>
        }
        description={
          <FormattedMessage
            defaultMessage="Contributions with a manual payment that have not been reconciled."
            id="NOpFmL"
          />
        }
      />

      <ContributionsTable
        accountSlug={accountSlug}
        queryFilter={queryFilter}
        orders={orders}
        loading={loading}
        nbPlaceholders={queryFilter.values.limit}
        error={error}
        refetch={refetch}
        columnVisibility={{ lastChargedAt: false, createdAt: true, expectedAt: false }}
      />
    </div>
  );
}

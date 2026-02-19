import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';
import type { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import type { Account, DashboardOrdersQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { childAccountFilter } from '../../filters/ChildAccountFilter';
import type { DashboardSectionProps } from '../../types';

import ContributionsTable from './ContributionsTable';
import type { FilterMeta as BaseFilterMeta } from './filters';
import {
  ContributionAccountingCategoryKinds,
  filters as baseFilters,
  schema as baseSchema,
  toVariables as baseToVariables,
} from './filters';
import { dashboardOrdersQuery } from './queries';
import { useIncomingOutgoingContributionViews } from './views';

const schema = baseSchema.extend({ account: childAccountFilter.schema });

type FilterValues = z.infer<typeof schema>;
type FilterMeta = BaseFilterMeta & {
  childrenAccounts?: Account[];
};

const toVariables: FiltersToVariables<FilterValues, DashboardOrdersQueryVariables, FilterMeta> = {
  ...baseToVariables,
  account: (value, key, meta) => {
    if (meta?.childrenAccounts && !meta.childrenAccounts.length) {
      return { includeChildrenAccounts: false };
    } else if (!value) {
      return { includeChildrenAccounts: true };
    } else {
      return { slug: value, includeChildrenAccounts: false };
    }
  },
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...baseFilters,
  account: childAccountFilter.filter,
};

const OutgoingContributions = ({ accountSlug }: DashboardSectionProps) => {
  const { account } = useContext(DashboardContext);

  const { views, refetch: refetchViews } = useIncomingOutgoingContributionViews(accountSlug, 'OUTGOING');

  const filterMeta: FilterMeta = {
    currency: account.currency,
    accountSlug: account.slug,
    childrenAccounts: account.childrenAccounts?.nodes ?? [],
    hostSlug: account.isHost ? account.slug : undefined,
    includeUncategorized: true,
    accountingCategoryKinds: ContributionAccountingCategoryKinds,
    manualPaymentProviders: account.manualPaymentProviders ?? account.host?.manualPaymentProviders ?? undefined,
  };

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    meta: filterMeta,
    views,
    filters,
  });

  const { data, loading, error, refetch } = useQuery(dashboardOrdersQuery, {
    variables: {
      slug: accountSlug,
      filter: 'OUTGOING',
      includeIncognito: true,
      ...queryFilter.variables,
    },

    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const handleRefetch = React.useCallback(() => {
    refetch();
    refetchViews();
  }, [refetch, refetchViews]);

  const currentViewCount = views.find(v => v.id === queryFilter.activeViewId)?.count;
  const nbPlaceholders = currentViewCount < queryFilter.values.limit ? currentViewCount : queryFilter.values.limit;

  const orders = data?.account?.orders ?? { nodes: [], totalCount: 0 };

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="OutgoingContributions" defaultMessage="Outgoing Contributions" />}
        description={
          <FormattedMessage
            id="OutgoingContributions.description"
            defaultMessage="Manage your contributions to other accounts."
          />
        }
      />

      <ContributionsTable
        accountSlug={accountSlug}
        queryFilter={queryFilter}
        views={views}
        orders={orders}
        loading={loading}
        nbPlaceholders={nbPlaceholders}
        error={error}
        refetch={handleRefetch}
      />
    </div>
  );
};

export default OutgoingContributions;

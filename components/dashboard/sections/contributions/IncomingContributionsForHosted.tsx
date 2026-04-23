import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import type { Account, DashboardOrdersQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { OppositeAccountScope } from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { AccountOrdersFilter } from '@/lib/graphql/types/v2/schema';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';

import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { childAccountFilter } from '../../filters/ChildAccountFilter';
import { tierFilter } from '../../filters/TierFilter';
import type { DashboardSectionProps } from '../../types';

import ContributionsTable from './ContributionsTable';
import type { FilterMeta as BaseFilterMeta } from './filters';
import {
  ContributionAccountingCategoryKinds,
  filters as baseFilters,
  schema as baseSchema,
  toVariables as baseToVariables,
} from './filters';
import { PausedIncomingContributionsMessage } from './PausedIncomingContributionsMessage';
import { dashboardOrdersQuery } from './queries';
import { getContributionViews, useFetchContributionViewCounts } from './views';

const schema = baseSchema.extend({ tier: tierFilter.schema, account: childAccountFilter.schema });

type FilterValues = z.infer<typeof schema>;
type FilterMeta = BaseFilterMeta & {
  childrenAccounts?: Account[];
  selectedAccountSlug?: string;
};

const toVariables: FiltersToVariables<FilterValues, DashboardOrdersQueryVariables, FilterMeta> = {
  ...baseToVariables,
  tier: tierFilter.toVariables,
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
  tier: tierFilter.filter,
  account: childAccountFilter.filter,
};

const IncomingContributionsForHosted = ({ accountSlug }: DashboardSectionProps) => {
  const intl = useIntl();
  const { account } = useContext(DashboardContext);
  const { LoggedInUser } = useLoggedInUser();
  const hasIncomingOutgoingReorg = LoggedInUser?.hasPreviewFeatureEnabled(
    PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_INCOMING_OUTGOING,
  );

  const views = React.useMemo(() => getContributionViews(intl), [intl]);

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

  const { viewCounts, refetch: refetchViews } = useFetchContributionViewCounts({
    slug: accountSlug,
    filter: AccountOrdersFilter.INCOMING,
    ...(hasIncomingOutgoingReorg && { oppositeAccountScope: OppositeAccountScope.EXTERNAL }),
  });

  const viewsWithCount = React.useMemo(
    () =>
      views.map(v => ({
        ...v,
        count: viewCounts[v.id as keyof typeof viewCounts],
      })),
    [views, viewCounts],
  );

  const { data, loading, error, refetch } = useQuery(dashboardOrdersQuery, {
    variables: {
      slug: accountSlug,
      filter: 'INCOMING',
      ...(hasIncomingOutgoingReorg && { oppositeAccountScope: OppositeAccountScope.EXTERNAL }),
      includeIncognito: true,
      includeChildrenAccounts: true,
      ...queryFilter.variables,
    },
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  // Add dynamic values to meta
  queryFilter.meta = {
    ...filterMeta,
    selectedAccountSlug: queryFilter.values.account || undefined,
  };

  const handleRefetch = React.useCallback(() => {
    refetch();
    refetchViews();
  }, [refetch, refetchViews]);

  const currentViewCount = viewsWithCount.find(v => v.id === queryFilter.activeViewId)?.count;
  const nbPlaceholders =
    (currentViewCount ?? 0) < queryFilter.values.limit ? (currentViewCount ?? 0) : queryFilter.values.limit;

  const orders = data?.account?.orders ?? { nodes: [], totalCount: 0 };

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="IncomingContributions" defaultMessage="Incoming Contributions" />}
        description={
          <FormattedMessage id="IncomingContributions.description" defaultMessage="Contributions to your account." />
        }
      />

      <PausedIncomingContributionsMessage accountSlug={accountSlug} />

      <ContributionsTable
        accountSlug={accountSlug}
        queryFilter={queryFilter}
        views={viewsWithCount}
        orders={orders}
        loading={loading}
        nbPlaceholders={nbPlaceholders}
        error={error}
        refetch={handleRefetch}
        showPaymentsSection
      />
    </div>
  );
};

export default IncomingContributionsForHosted;

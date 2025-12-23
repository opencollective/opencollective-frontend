import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { PlusIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import { gql } from '../../../../lib/graphql/helpers';
import { ExpectedFundsFilter, OrderStatus } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { FEATURES, requiresUpgrade } from '@/lib/allowed-features';
import type { DashboardOrdersQueryVariables } from '@/lib/graphql/types/v2/graphql';

import { UpgradePlanCTA } from '@/components/platform-subscriptions/UpgradePlanCTA';

import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { expectedDateFilter } from '../../filters/DateFilter';
import type { DashboardSectionProps } from '../../types';

import ContributionsTable from './ContributionsTable';
import CreatePendingContributionModal from './CreatePendingOrderModal';
import type { FilterMeta } from './filters';
import {
  ContributionAccountingCategoryKinds,
  filters as baseFilters,
  schema as baseSchema,
  toVariables as baseToVariables,
} from './filters';
import { dashboardOrdersQuery } from './queries';

enum ContributionsTab {
  ALL = 'ALL',
  PENDING = 'PENDING',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
}

const hostExpectedFundsMetadataQuery = gql`
  query HostExpectedFundsMetadata($slug: String!, $expectedFundsFilter: ExpectedFundsFilter) {
    account(slug: $slug) {
      id
      slug
      name
      type
      settings
      imageUrl
      currency
      ... on AccountWithHost {
        host {
          id
          slug
          name
          imageUrl
          type
          hostFeePercent
        }
      }
      PENDING: orders(
        filter: INCOMING
        expectedFundsFilter: $expectedFundsFilter
        status: [PENDING]
        hostContext: ALL
      ) {
        totalCount
      }
      EXPIRED: orders(
        filter: INCOMING
        expectedFundsFilter: $expectedFundsFilter
        status: [EXPIRED]
        hostContext: ALL
      ) {
        totalCount
      }
      PAID: orders(
        filter: INCOMING
        expectedFundsFilter: $expectedFundsFilter
        status: [PAID]
        includeIncognito: true
        hostContext: ALL
      ) {
        totalCount
      }
      CANCELED: orders(
        filter: INCOMING
        expectedFundsFilter: $expectedFundsFilter
        status: [CANCELLED]
        includeIncognito: true
        hostContext: ALL
      ) {
        totalCount
      }
    }
  }
`;

const schema = baseSchema.extend({
  expectedDate: expectedDateFilter.schema,
});
type FilterValues = z.infer<typeof schema>;
const toVariables: FiltersToVariables<FilterValues, DashboardOrdersQueryVariables, FilterMeta> = {
  ...baseToVariables,
  expectedDate: expectedDateFilter.toVariables,
};
const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...baseFilters,
  expectedDate: expectedDateFilter.filter,
};

function HostExpectedFunds({ accountSlug }: DashboardSectionProps) {
  const intl = useIntl();
  const { account } = useContext(DashboardContext);

  const isUpgradeRequired = requiresUpgrade(account, FEATURES.EXPECTED_FUNDS);
  const [showCreatePendingOrderModal, setShowCreatePendingOrderModal] = React.useState(false);

  const views: Views<z.infer<typeof schema>> = [
    {
      id: ContributionsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
    },
    {
      id: ContributionsTab.PENDING,
      label: intl.formatMessage({ defaultMessage: 'Pending', id: 'eKEL/g' }),
      filter: {
        status: [OrderStatus.PENDING],
      },
    },
    {
      id: ContributionsTab.PAID,
      label: intl.formatMessage({ defaultMessage: 'Paid', id: 'u/vOPu' }),
      filter: {
        status: [OrderStatus.PAID],
      },
    },
    {
      id: ContributionsTab.EXPIRED,
      label: intl.formatMessage({ defaultMessage: 'Expired', id: 'RahCRH' }),
      filter: {
        status: [OrderStatus.EXPIRED],
      },
    },
    {
      id: ContributionsTab.CANCELED,
      label: intl.formatMessage({ defaultMessage: 'Cancelled', id: '3wsVWF' }),
      filter: {
        status: [OrderStatus.CANCELLED],
      },
    },
  ];

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
    views,
    filters,
  });

  const { data: metadata, refetch: refetchMetadata } = useQuery(hostExpectedFundsMetadataQuery, {
    variables: {
      slug: accountSlug,
      expectedFundsFilter: ExpectedFundsFilter.ONLY_PENDING,
    },

    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
    skip: isUpgradeRequired,
  });

  const { data, loading, error, refetch } = useQuery(dashboardOrdersQuery, {
    variables: {
      slug: accountSlug,
      filter: 'INCOMING',
      includeIncognito: true,
      hostContext: 'ALL',
      expectedFundsFilter: ExpectedFundsFilter.ONLY_PENDING,
      ...queryFilter.variables,
    },

    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
    skip: isUpgradeRequired,
  });

  const handleRefetch = React.useCallback(() => {
    refetch();
    refetchMetadata();
  }, [refetch, refetchMetadata]);

  const viewsWithCount = views.map(view => ({
    ...view,
    count: metadata?.account?.[view.id]?.totalCount,
  }));

  const currentViewCount = viewsWithCount.find(v => v.id === queryFilter.activeViewId)?.count;
  const nbPlaceholders = currentViewCount < queryFilter.values.limit ? currentViewCount : queryFilter.values.limit;

  const orders = data?.account?.orders ?? { nodes: [], totalCount: 0 };

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="ExpectedFunds" defaultMessage="Expected Funds" />}
        description={<FormattedMessage defaultMessage="Expected funds for Collectives you host." id="tNEw2N" />}
        actions={
          <React.Fragment>
            <Button
              size="sm"
              onClick={() => setShowCreatePendingOrderModal(true)}
              className="gap-1"
              data-cy="create-pending-contribution"
              disabled={isUpgradeRequired}
            >
              <span>
                <FormattedMessage defaultMessage="Create" id="create" />
              </span>
              <PlusIcon size={20} />
            </Button>
            <CreatePendingContributionModal
              hostSlug={accountSlug}
              open={showCreatePendingOrderModal}
              setOpen={setShowCreatePendingOrderModal}
              onSuccess={handleRefetch}
            />
          </React.Fragment>
        }
      />

      {isUpgradeRequired ? (
        <UpgradePlanCTA featureKey={FEATURES.EXPECTED_FUNDS} />
      ) : (
        <ContributionsTable
          accountSlug={accountSlug}
          queryFilter={queryFilter}
          views={viewsWithCount}
          orders={orders}
          loading={loading}
          nbPlaceholders={nbPlaceholders}
          error={error}
          refetch={handleRefetch}
          onlyExpectedFunds
          hostSlug={accountSlug}
          columnVisibility={{
            legacyId: true,
            fromAccount: false,
            expectedAt: true,
          }}
        />
      )}
    </div>
  );
}

export default HostExpectedFunds;

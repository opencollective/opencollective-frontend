import React, { useContext } from 'react';
import { useApolloClient, useQuery } from '@apollo/client';
import { omit } from 'lodash';
import { PlusIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import type { Views } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import { ExpectedFundsFilter, OrderStatus } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { FEATURES, requiresUpgrade } from '@/lib/allowed-features';

import { UpgradePlanCTA } from '@/components/platform-subscriptions/UpgradePlanCTA';

import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import type { DashboardSectionProps } from '../../types';

import ContributionsTable from './ContributionsTable';
import CreatePendingContributionModal from './CreatePendingOrderModal';
import type { FilterMeta } from './filters';
import { filters as allFilters, hostSchema, toVariables } from './filters';

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

const expectedFundsFilters = omit(allFilters, ['tier']);

function HostExpectedFunds({ accountSlug }: DashboardSectionProps) {
  const intl = useIntl();
  const { account } = useContext(DashboardContext);
  const client = useApolloClient();

  const isUpgradeRequired = requiresUpgrade(account, FEATURES.EXPECTED_FUNDS);
  const [showCreatePendingOrderModal, setShowCreatePendingOrderModal] = React.useState(false);

  const views: Views<z.infer<typeof hostSchema>> = [
    {
      id: ContributionsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {
        expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
      },
    },
    {
      id: ContributionsTab.PENDING,
      label: intl.formatMessage({ defaultMessage: 'Pending', id: 'eKEL/g' }),
      filter: {
        status: [OrderStatus.PENDING],
        expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
      },
    },
    {
      id: ContributionsTab.PAID,
      label: intl.formatMessage({ defaultMessage: 'Paid', id: 'u/vOPu' }),
      filter: {
        status: [OrderStatus.PAID],
        expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
      },
    },
    {
      id: ContributionsTab.EXPIRED,
      label: intl.formatMessage({ defaultMessage: 'Expired', id: 'RahCRH' }),
      filter: {
        status: [OrderStatus.EXPIRED],
        expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
      },
    },
    {
      id: ContributionsTab.CANCELED,
      label: intl.formatMessage({ defaultMessage: 'Cancelled', id: '3wsVWF' }),
      filter: {
        status: [OrderStatus.CANCELLED],
        expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
      },
    },
  ];

  const filterMeta: FilterMeta = {
    currency: account?.currency,
    childrenAccounts: [],
    accountSlug: account?.slug,
    showChildAccountFilter: false,
  };

  const queryFilter = useQueryFilter({
    schema: hostSchema,
    toVariables,
    meta: filterMeta,
    views,
    filters: expectedFundsFilters,
  });

  const { data: metadata, refetch: refetchMetadata } = useQuery(hostExpectedFundsMetadataQuery, {
    variables: {
      slug: accountSlug,
      expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
    },
    context: API_V2_CONTEXT,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
    skip: isUpgradeRequired,
  });

  const viewsWithCount = views.map(view => ({
    ...view,
    count: metadata?.account?.[view.id]?.totalCount,
  }));

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
            {showCreatePendingOrderModal && (
              <CreatePendingContributionModal
                hostSlug={accountSlug}
                onClose={() => setShowCreatePendingOrderModal(false)}
                onSuccess={() => {
                  refetchMetadata();
                  client.refetchQueries({
                    include: ['DashboardRecurringContributions'],
                  });
                }}
              />
            )}
          </React.Fragment>
        }
      />

      {isUpgradeRequired ? (
        <UpgradePlanCTA featureKey={FEATURES.EXPECTED_FUNDS} />
      ) : (
        <ContributionsTable
          accountSlug={accountSlug}
          direction="INCOMING"
          queryFilter={queryFilter}
          views={viewsWithCount}
          onlyExpectedFunds
          includeChildrenAccounts={false}
          hostSlug={accountSlug}
          onRefetch={refetchMetadata}
        />
      )}
    </div>
  );
}

export default HostExpectedFunds;

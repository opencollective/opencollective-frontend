import React from 'react';

import type { DashboardSectionProps } from '../../types';

import ContributionsTable from './ContributionsTable';
import DashboardHeader from '../../DashboardHeader';
import { FormattedMessage, useIntl } from 'react-intl';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { DashboardContext } from '../../DashboardContext';
import { schema, toVariables, filters as allFilters } from './filters';
import { Views } from '@/lib/filters/filter-types';
import z from 'zod';
import { ContributionFrequency, OrderStatus } from '@/lib/graphql/types/v2/graphql';
import { omit } from 'lodash';
import { gql, useQuery } from '@apollo/client';
import { useGetViewCounts } from './views';
import { ALL_SECTIONS } from '../../constants';
import { amount, beneficiary, contributionId, contributor, date, expectedAt, paymentMethod, status } from './columns';
import { actionsColumn } from '@/components/table/DataTable';
import { PausedIncomingContributionsMessage } from './PausedIncomingContributionsMessage';

enum IncomingContributionsTab {
  ALL = 'ALL',
  RECURRING = 'RECURRING',
  ONETIME = 'ONETIME',
  PAUSED = 'PAUSED',
  CANCELED = 'CANCELED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  DISPUTED = 'DISPUTED',
  IN_REVIEW = 'IN_REVIEW',
  ERROR = 'ERROR',
}
const dashboardContributionsMetadataQuery = gql`
  query DashboardContributionsMetadata($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      slug
      name
      type
      settings
      imageUrl
      currency
      childrenAccounts {
        totalCount
        nodes {
          id
          slug
          name
          ... on AccountWithContributions {
            tiers {
              nodes {
                id
                name
              }
            }
          }
        }
      }
      ... on AccountWithContributions {
        canStartResumeContributionsProcess
        hasResumeContributionsProcessStarted
        tiers {
          nodes {
            id
            name
          }
        }
      }
      ... on AccountWithParent {
        parent {
          id
          slug
          type
        }
      }
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
    }
  }
`;

const filters = omit(allFilters, ['expectedFundsFilter', 'expectedDate']);
const columns = [contributor, beneficiary, amount, date, paymentMethod, status, actionsColumn];
const IncomingContributions = (props: DashboardSectionProps) => {
  const { account } = React.useContext(DashboardContext);
  const intl = useIntl();

  const views: Views<z.infer<typeof schema>> = [
    {
      id: IncomingContributionsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
    },

    {
      id: IncomingContributionsTab.RECURRING,
      label: intl.formatMessage({ defaultMessage: 'Recurring', id: 'v84fNv' }),
      filter: {
        frequency: [ContributionFrequency.MONTHLY, ContributionFrequency.YEARLY],
        status: [OrderStatus.ACTIVE, OrderStatus.ERROR],
      },
    },

    {
      id: IncomingContributionsTab.ONETIME,
      label: intl.formatMessage({ defaultMessage: 'One-Time', id: 'jX0G5O' }),
      filter: {
        frequency: [ContributionFrequency.ONETIME],
        status: [OrderStatus.PAID, OrderStatus.PROCESSING],
      },
    },

    {
      id: IncomingContributionsTab.PAUSED,
      label: intl.formatMessage({ id: 'order.paused', defaultMessage: 'Paused' }),
      filter: {
        status: [OrderStatus.PAUSED],
      },
    },

    {
      id: IncomingContributionsTab.CANCELED,
      label: intl.formatMessage({ defaultMessage: 'Cancelled', id: '3wsVWF' }),
      filter: {
        status: [OrderStatus.CANCELLED],
      },
    },
  ];
  const {
    data: metadata,
    loading: metadataLoading,
    error: metadataError,
    refetch: refetchMetadata,
  } = useQuery(dashboardContributionsMetadataQuery, {
    variables: {
      slug: accountSlug,
      filter: direction || 'OUTGOING',
      onlyExpectedFunds: !!onlyExpectedFunds,
      expectedFundsFilter: onlyExpectedFunds ? ExpectedFundsFilter.ALL_EXPECTED_FUNDS : null,
      includeHostedAccounts: !!includeHostedAccounts,
      includeChildrenAccounts: !!includeChildrenAccounts,
    },
    context: API_V2_CONTEXT,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const tierOptions = React.useMemo(() => {
    if (!includeChildrenAccounts) {
      return [];
    }
    if (metadata?.account.childrenAccounts.nodes?.length === 0) {
      return metadata.account?.tiers?.nodes.map(tier => ({ label: tier.name, value: tier.id }));
    } else {
      const makeOption = account =>
        account?.tiers?.nodes.map(tier => ({ label: `${tier.name}  (${account.name})`, value: tier.id }));
      const options = makeOption(metadata?.account);
      metadata?.account.childrenAccounts.nodes.forEach(children => {
        options.push(...makeOption(children));
      });
      return options;
    }
  }, [metadata?.account]);

  const filterMeta: FilterMeta = {
    currency: account?.currency,
    tierOptions: tierOptions,
    childrenAccounts: account?.childrenAccounts?.nodes ?? [],
    accountSlug: account?.slug,
    showChildAccountFilter: true,
  };

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    meta: filterMeta,
    views,
    skipFiltersOnReset: ['hostContext'],
    filters,
  });

  const { viewCounts, refetchViewCounts } = useGetViewCounts(ALL_SECTIONS.INCOMING_CONTRIBUTIONS);
  const viewsWithCount = React.useMemo(
    () => views.map(view => ({ ...view, count: viewCounts?.account?.[view.id]?.totalCount })),
    [viewCounts, views],
  );

  return (
    <div>
      <DashboardHeader
        title={<FormattedMessage id="IncomingContributions" defaultMessage="Incoming Contributions" />}
        description={
          <FormattedMessage id="IncomingContributions.description" defaultMessage="Contributions to your account." />
        }
      />
      {metadata?.account?.canStartResumeContributionsProcess &&
        viewCounts?.account?.PAUSED_RESUMABLE.totalCount > 0 &&
        !metadata.account.parent && (
          <PausedIncomingContributionsMessage
            account={metadata.account}
            count={viewCounts.account[ContributionsTab.PAUSED].totalCount}
          />
        )}
      <ContributionsTable
        {...props}
        direction="INCOMING"
        includeChildrenAccounts
        queryFilter={queryFilter}
        columns={columns}
      />
    </div>
  );
};

export default IncomingContributions;

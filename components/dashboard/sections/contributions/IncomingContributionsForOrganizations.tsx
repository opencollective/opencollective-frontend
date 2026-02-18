import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { Views } from '../../../../lib/filters/filter-types';
import { gql } from '../../../../lib/graphql/helpers';
import { OrderStatus } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { isMulti } from '@/lib/filters/schemas';
import type { AccountHoverCardFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { HostContextFilter, hostContextFilter } from '../../filters/HostContextFilter';
import { hostedAccountsFilter } from '../../filters/HostedAccountFilter';
import type { DashboardSectionProps } from '../../types';

import ContributionsTable, { defaultVisibility } from './ContributionsTable';
import type { FilterMeta } from './filters';
import { ContributionAccountingCategoryKinds, filters, schema as baseSchema, toVariables } from './filters';
import { PausedIncomingContributionsMessage } from './PausedIncomingContributionsMessage';
import { dashboardOrdersQuery } from './queries';

enum ContributionsTab {
  ALL = 'ALL',
  DISPUTED = 'DISPUTED',
  ERROR = 'ERROR',
  IN_REVIEW = 'IN_REVIEW',
  PAUSED = 'PAUSED',
}

const hostFinancialContributionsMetadataQuery = gql`
  query HostFinancialContributionsMetadata($slug: String!, $hostContext: HostContext) {
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
      DISPUTED: orders(filter: INCOMING, status: [DISPUTED], includeIncognito: true, hostContext: $hostContext) {
        totalCount
      }
      IN_REVIEW: orders(filter: INCOMING, status: [IN_REVIEW], includeIncognito: true, hostContext: $hostContext) {
        totalCount
      }
      ERROR: orders(filter: INCOMING, status: [ERROR], includeIncognito: true, hostContext: $hostContext) {
        totalCount
      }
      PAUSED: orders(filter: INCOMING, status: [PAUSED], includeIncognito: true, hostContext: $hostContext) {
        totalCount
      }
    }
  }
`;

const schema = baseSchema.extend({
  hostContext: hostContextFilter.schema,
  hostedAccounts: isMulti(z.string()).optional(),
});

export default function IncomingContributionsForOrganizations({ accountSlug }: DashboardSectionProps) {
  const intl = useIntl();
  const { account } = useContext(DashboardContext);

  const views: Views<z.infer<typeof schema>> = [
    {
      id: ContributionsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
    },
    {
      id: ContributionsTab.DISPUTED,
      label: intl.formatMessage({ defaultMessage: 'Disputed', id: 'X1pwhF' }),
      filter: {
        status: [OrderStatus.DISPUTED],
      },
    },
    {
      id: ContributionsTab.IN_REVIEW,
      label: intl.formatMessage({ id: 'order.in_review', defaultMessage: 'In Review' }),
      filter: {
        status: [OrderStatus.IN_REVIEW],
      },
    },
    {
      id: ContributionsTab.PAUSED,
      label: intl.formatMessage({ defaultMessage: 'Paused', id: 'C2iTEH' }),
      filter: {
        status: [OrderStatus.PAUSED],
      },
    },
    {
      id: ContributionsTab.ERROR,
      label: intl.formatMessage({ defaultMessage: 'Error', id: 'Error' }),
      filter: {
        status: [OrderStatus.ERROR],
      },
    },
  ];

  const filterMeta: FilterMeta & {
    hostedAccounts?: Array<AccountHoverCardFieldsFragment>;
  } = {
    currency: account.currency,
    accountSlug: account.slug,
    hostSlug: account.isHost ? account.slug : undefined,
    includeUncategorized: true,
    accountingCategoryKinds: ContributionAccountingCategoryKinds,
  };

  const queryFilter = useQueryFilter({
    schema,
    toVariables: {
      ...toVariables,
      hostedAccounts: hostedAccountsFilter.toVariables,
    },
    meta: filterMeta,
    views,
    filters: { ...filters, hostedAccounts: hostedAccountsFilter.filter },
    skipFiltersOnReset: ['hostContext'],
  });

  const { data: metadata, refetch: refetchMetadata } = useQuery(hostFinancialContributionsMetadataQuery, {
    variables: {
      slug: accountSlug,
      hostContext: account.hasHosting ? queryFilter.values.hostContext : undefined,
    },

    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const { data, loading, error, refetch } = useQuery(dashboardOrdersQuery, {
    variables: {
      slug: accountSlug,
      filter: 'INCOMING',
      includeIncognito: true,
      ...queryFilter.variables,
    },

    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
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
        title={
          <div className="flex flex-1 flex-wrap items-center justify-between gap-4">
            <FormattedMessage id="IncomingContributions" defaultMessage="Incoming Contributions" />
            {account.hasHosting && (
              <HostContextFilter
                value={queryFilter.values.hostContext}
                onChange={val => queryFilter.setFilter('hostContext', val)}
                intl={intl}
              />
            )}
          </div>
        }
        description={
          account.hasHosting ? (
            <FormattedMessage
              defaultMessage="Contributions made to your Organization and Collectives you host."
              id="To33FZ"
            />
          ) : (
            <FormattedMessage defaultMessage="Contributions made to your Organization." id="2IsUyp" />
          )
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
        columnVisibility={{ ...defaultVisibility, accountingCategory: true }}
      />
    </div>
  );
}

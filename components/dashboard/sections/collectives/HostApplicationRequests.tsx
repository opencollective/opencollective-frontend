import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import { limit, offset } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  HostApplicationRequestsQuery,
  HostApplicationRequestsQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { HostApplicationStatus } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import i18nHostApplicationStatus from '../../../../lib/i18n/host-application-status';
import { sortSelectOptions } from '../../../../lib/utils';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { orderByFilter } from '../../filters/OrderFilter';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';

import HostApplicationDrawer from './HostApplicationDrawer';
import HostApplicationsTable from './HostApplicationsTable';
import { HostApplicationFields } from './queries';

const schema = z.object({
  limit,
  offset,
  orderBy: orderByFilter.schema,
  status: z.nativeEnum(HostApplicationStatus).optional(),
  hostApplicationId: z.string().nullable().optional(),
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostApplicationRequestsQueryVariables> = {
  orderBy: orderByFilter.toVariables,
};

const filters: FilterComponentConfigs<z.infer<typeof schema>> = {
  orderBy: orderByFilter.filter,
  status: {
    labelMsg: defineMessage({ defaultMessage: 'Status', id: 'tzMNF3' }),
    Component: ({ intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(HostApplicationStatus)
          .map(value => ({ label: i18nHostApplicationStatus(intl, value), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nHostApplicationStatus(intl, value),
  },
};

export default function HostApplicationRequests({ accountSlug }: DashboardSectionProps) {
  const intl = useIntl();

  const metadataQuery = useQuery(
    gql`
      query HostApplicationRequestsMetadata($accountSlug: String!) {
        account(slug: $accountSlug) {
          pending: hostApplicationRequests(limit: 0, offset: 0, status: PENDING) {
            totalCount
          }
          approved: hostApplicationRequests(limit: 0, offset: 0, status: APPROVED) {
            totalCount
          }
          rejected: hostApplicationRequests(limit: 0, offset: 0, status: REJECTED) {
            totalCount
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        accountSlug,
      },
    },
  );

  const views: Views<z.infer<typeof schema>> = [
    {
      id: 'pending',
      label: intl.formatMessage({ defaultMessage: 'Pending', id: 'eKEL/g' }),
      filter: {
        status: HostApplicationStatus.PENDING,
      },
      count: metadataQuery.data?.account?.pending?.totalCount,
    },
    {
      id: 'approved',
      label: intl.formatMessage({ defaultMessage: 'Approved', id: '6XFO/C' }),
      filter: { status: HostApplicationStatus.APPROVED },
      count: metadataQuery.data?.account?.approved?.totalCount,
    },
    {
      id: 'rejected',
      label: intl.formatMessage({ defaultMessage: 'Rejected', id: '5qaD7s' }),
      filter: { status: HostApplicationStatus.REJECTED },
      count: metadataQuery.data?.account?.rejected?.totalCount,
    },
  ];
  const queryFilter = useQueryFilter<typeof schema, HostApplicationRequestsQueryVariables>({
    schema,
    filters,
    toVariables,
    views,
  });

  const query = useQuery<HostApplicationRequestsQuery, HostApplicationRequestsQueryVariables>(
    gql`
      query HostApplicationRequests(
        $accountSlug: String!
        $limit: Int
        $offset: Int
        $orderBy: ChronologicalOrderInput
        $status: HostApplicationStatus
      ) {
        account(slug: $accountSlug) {
          hostApplicationRequests(status: $status, limit: $limit, offset: $offset, orderBy: $orderBy) {
            totalCount
            nodes {
              ...HostApplicationFields
            }
          }
        }
      }

      ${HostApplicationFields}
    `,
    {
      variables: { accountSlug, ...queryFilter.variables },
      context: API_V2_CONTEXT,
    },
  );

  const currentViewCount = views.find(v => v.id === queryFilter.activeViewId)?.count;
  const nbPlaceholders = currentViewCount < queryFilter.values.limit ? currentViewCount : queryFilter.values.limit;

  const error = metadataQuery.error || query.error;
  const loading = metadataQuery.loading || query.loading;

  const applicationRequests = query.data?.account?.hostApplicationRequests?.nodes ?? [];
  const totalCount = query.data?.account?.hostApplicationRequests?.totalCount ?? 0;

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader title={<FormattedMessage defaultMessage="Host Application Requests" id="BM+sH/" />} />

      <Filterbar {...queryFilter} />

      {error ? (
        <MessageBoxGraphqlError error={error} mb={2} />
      ) : !loading && applicationRequests.length === 0 ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="HOST_APPLICATIONS"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <HostApplicationsTable
            hostApplications={applicationRequests}
            nbPlaceholders={nbPlaceholders}
            loading={loading}
            openApplication={application => queryFilter.setFilter('hostApplicationId', application.id)}
          />
          <Pagination queryFilter={queryFilter} total={totalCount} />
        </React.Fragment>
      )}

      <HostApplicationDrawer
        open={!!queryFilter.values.hostApplicationId}
        onClose={() => queryFilter.setFilter('hostApplicationId', null)}
        applicationId={queryFilter.values.hostApplicationId}
      />
    </div>
  );
}

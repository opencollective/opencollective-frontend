import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { limit, offset } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  HostApplicationRequestsQuery,
  HostApplicationRequestsQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { EmptyResults } from '../../EmptyResults';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';

import HostApplicationDrawer from './HostApplicationDrawer';
import HostApplicationsTable from './HostApplicationsTable';
import { HostApplicationFields } from './queries';

const schema = z.object({
  limit,
  offset,
  hostApplicationId: z.string().nullable().optional(),
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostApplicationRequestsQueryVariables> = {};

const filters: FilterComponentConfigs<z.infer<typeof schema>> = {};

export default function HostApplicationRequests({
  accountSlug,
  editCollectiveMutation,
}: DashboardSectionProps & {
  editCollectiveMutation?: (collective: { id: number; HostCollectiveId?: number }) => Promise<void>;
}) {
  const queryFilter = useQueryFilter<typeof schema, HostApplicationRequestsQueryVariables>({
    schema,
    filters,
    toVariables,
  });

  const query = useQuery<HostApplicationRequestsQuery, HostApplicationRequestsQueryVariables>(
    gql`
      query HostApplicationRequests($accountSlug: String!, $limit: Int, $offset: Int) {
        account(slug: $accountSlug) {
          hostApplicationRequests(limit: $limit, offset: $offset) {
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

  const nbPlaceholders = queryFilter.values.limit;

  const error = query.error;
  const loading = query.loading;

  const applicationRequests = query.data?.account?.hostApplicationRequests?.nodes ?? [];
  const totalCount = query.data?.account?.hostApplicationRequests?.totalCount ?? 0;

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
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
        editCollectiveMutation={editCollectiveMutation}
      />
    </div>
  );
}

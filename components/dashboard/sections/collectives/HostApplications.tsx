import React from 'react';
import { useQuery } from '@apollo/client';
import { omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import { limit, offset } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { HostApplicationsQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { HostApplicationStatus } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import i18nHostApplicationStatus from '../../../../lib/i18n/host-application-status';
import { sortSelectOptions } from '../../../../lib/utils';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import Pagination from '../../../Pagination';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { orderByFilter } from '../../filters/OrderFilter';
import { searchFilter } from '../../filters/SearchFilter';
import type { DashboardSectionProps } from '../../types';

import HostApplicationDrawer from './HostApplicationDrawer';
import HostApplicationsTable from './HostApplicationsTable';
import { hostApplicationsMetadataQuery, hostApplicationsQuery } from './queries';

const schema = z.object({
  limit,
  offset,
  searchTerm: searchFilter.schema,
  orderBy: orderByFilter.schema,
  status: z.nativeEnum(HostApplicationStatus).optional(),
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostApplicationsQueryVariables> = {
  orderBy: orderByFilter.toVariables,
};

const filters: FilterComponentConfigs<z.infer<typeof schema>> = {
  orderBy: orderByFilter.filter,
  searchTerm: searchFilter.filter,
  status: {
    labelMsg: defineMessage({ defaultMessage: 'Status' }),
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

const ROUTE_PARAMS = ['hostCollectiveSlug', 'slug', 'section', 'view'];

const updateQuery = (router, newParams) => {
  const query = omitBy({ ...router.query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
  const pathname = router.asPath.split('?')[0].split('#')[0];
  return router.push({ pathname, query });
};

const HostApplications = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const router = useRouter();
  const intl = useIntl();
  const { data: metadata } = useQuery(hostApplicationsMetadataQuery, {
    variables: { hostSlug },
    fetchPolicy: 'cache-and-network',
    context: API_V2_CONTEXT,
  });

  const views: Views<z.infer<typeof schema>> = [
    {
      id: 'pending',
      label: intl.formatMessage({ defaultMessage: 'Pending' }),
      filter: {
        status: HostApplicationStatus.PENDING,
      },
      count: metadata?.host?.pending?.totalCount,
    },
    {
      id: 'approved',
      label: intl.formatMessage({ defaultMessage: 'Approved' }),
      filter: { status: HostApplicationStatus.APPROVED },
      count: metadata?.host?.approved?.totalCount,
    },
    {
      id: 'rejected',
      label: intl.formatMessage({ defaultMessage: 'Rejected' }),
      filter: { status: HostApplicationStatus.REJECTED },
      count: metadata?.host?.rejected?.totalCount,
    },
  ];
  const queryFilter = useQueryFilter({
    schema,
    filters,
    toVariables,
    views,
  });

  const { data, error, loading, variables } = useQuery(hostApplicationsQuery, {
    variables: { hostSlug, ...queryFilter.variables },
    fetchPolicy: 'cache-and-network',
    context: API_V2_CONTEXT,
  });

  // Open application account id, checking hash for backwards compatibility
  const accountId = Number(router.query.accountId || window?.location.hash.split('application-')[1]);
  const [applicationInDrawer, setApplicationInDrawer] = React.useState(null);
  const drawerOpen = accountId && applicationInDrawer;

  React.useEffect(() => {
    if (accountId) {
      const application = data?.host?.hostApplications?.nodes?.find(a => a.account.legacyId === accountId);
      if (application) {
        setApplicationInDrawer(application);
      }
    }
  }, [accountId, data?.host?.hostApplications]);

  const hostApplications = data?.host?.hostApplications;

  const currentViewCount = views.find(v => v.id === queryFilter.activeViewId)?.count;
  const nbPlaceholders = currentViewCount < queryFilter.values.limit ? currentViewCount : queryFilter.values.limit;

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader title={<FormattedMessage id="Menu.HostApplications" defaultMessage="Host Applications" />} />

      <Filterbar {...queryFilter} />

      {error ? (
        <MessageBoxGraphqlError error={error} mb={2} />
      ) : !loading && !hostApplications?.nodes.length ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="HOST_APPLICATIONS"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <HostApplicationsTable
            hostApplications={hostApplications}
            nbPlaceholders={nbPlaceholders}
            loading={loading}
            openApplication={application => updateQuery(router, { accountId: application.account.legacyId })}
          />
          <div className="mt-16 flex justify-center">
            <Pagination
              total={hostApplications?.totalCount}
              limit={variables.limit}
              offset={variables.offset}
              ignoredQueryParams={ROUTE_PARAMS}
            />
          </div>
        </React.Fragment>
      )}

      <HostApplicationDrawer
        open={drawerOpen}
        onClose={() => updateQuery(router, { accountId: null })}
        host={metadata?.host}
        application={applicationInDrawer}
      />
    </div>
  );
};

export default HostApplications;

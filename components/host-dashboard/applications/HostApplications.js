import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import DashboardViews from '../../dashboard/DashboardViews';
import { Box } from '../../Grid';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import Pagination from '../../Pagination';
import SearchBar from '../../SearchBar';
import HostAdminCollectiveFilters, { COLLECTIVE_FILTER } from '../HostAdminCollectiveFilters';

import HostApplicationDrawer from './HostApplicationDrawer';
import HostApplicationsTable from './HostApplicationsTable';
import { hostApplicationsQuery } from './queries';

const COLLECTIVES_PER_PAGE = 20;

const getVariablesFromQuery = query => {
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || COLLECTIVES_PER_PAGE,
    searchTerm: query.searchTerm,
    hostFeesStructure: query['fees-structure'],
    status: query.status,
    orderBy: {
      field: 'CREATED_AT',
      direction: query['sort-by'] === 'oldest' ? 'ASC' : 'DESC',
    },
  };
};

const ROUTE_PARAMS = ['hostCollectiveSlug', 'slug', 'section', 'view'];

const updateQuery = (router, newParams) => {
  const query = omitBy({ ...router.query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
  const pathname = router.asPath.split('?')[0];
  return router.push({ pathname, query });
};

const enforceDefaultParamsOnQuery = query => {
  return {
    ...query,
    status: query.status || 'PENDING',
  };
};

const HostApplications = ({ hostSlug, isDashboard }) => {
  const router = useRouter() || {};
  const intl = useIntl();
  const query = enforceDefaultParamsOnQuery(router.query);
  const { data, error, loading, variables } = useQuery(hostApplicationsQuery, {
    variables: { hostSlug, ...getVariablesFromQuery(query) },
    fetchPolicy: 'cache-and-network',
    context: API_V2_CONTEXT,
  });

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [applicationInDrawer, setApplicationInDrawer] = React.useState(null);

  const pageRoute = isDashboard ? `/dashboard/${hostSlug}/host-applications` : `/${hostSlug}/admin/host-applications`;

  const hostApplications = data?.host?.hostApplications;
  const initViews = [
    {
      label: intl.formatMessage({ defaultMessage: 'Pending' }),
      query: {
        status: 'PENDING',
      },
      id: 'pending',
      showCount: true,
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Approved' }),
      query: { status: 'APPROVED' },
      showCount: true,
      id: 'approved',
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Rejected' }),
      query: { status: 'REJECTED' },
      showCount: true,
      id: 'rejected',
    },
  ];
  const [views, setViews] = React.useState(initViews);

  React.useEffect(() => {
    if (data) {
      setViews(
        initViews.map(view => {
          return {
            ...view,
            count: data.host[view.id]?.totalCount,
          };
        }),
      );
    }
  }, [data]);

  return (
    <div className="grid flex-1 grid-cols-6 gap-6">
      <div className="col-span-4 ">
        <div className="flex flex-wrap justify-between gap-4">
          <h1 className="text-2xl font-bold leading-10 tracking-tight">
            <FormattedMessage defaultMessage="Applications" />
          </h1>
          <SearchBar
            height={40}
            defaultValue={query.searchTerm}
            onSubmit={searchTerm => updateQuery(router, { searchTerm, offset: null })}
          />
        </div>

        <DashboardViews
          query={query}
          omitMatchingParams={[...ROUTE_PARAMS, 'orderBy']}
          views={views}
          onChange={query => {
            router.push(
              {
                pathname: pageRoute,
                query,
              },
              undefined,
              { scroll: false },
            );
          }}
        />
        <div className="mb-6">
          <HostAdminCollectiveFilters
            filters={[COLLECTIVE_FILTER.SORT_BY]}
            values={query}
            onChange={queryParams =>
              updateQuery(router, {
                ...queryParams,
                offset: null,
              })
            }
          />
        </div>

        {error && <MessageBoxGraphqlError error={error} mb={2} />}

        <HostApplicationsTable
          hostApplications={hostApplications}
          nbPlaceholders={COLLECTIVES_PER_PAGE}
          loading={loading}
          openApplication={application => {
            setDrawerOpen(true);
            setApplicationInDrawer(application);
          }}
        />

        <div className="mt-16 flex justify-center">
          <Pagination
            total={hostApplications?.totalCount}
            limit={variables.limit}
            offset={variables.offset}
            ignoredQueryParams={ROUTE_PARAMS}
          />
        </div>

        <HostApplicationDrawer
          open={drawerOpen}
          setOpen={setDrawerOpen}
          host={data?.host}
          application={applicationInDrawer}
        />
      </div>
      <div className="col-span-2  flex-1 rounded bg-slate-50 p-6">
        <p>No application selected</p>
      </div>
    </div>
  );
};

HostApplications.propTypes = {
  hostSlug: PropTypes.string.isRequired,
  isDashboard: PropTypes.bool,
};

export default HostApplications;

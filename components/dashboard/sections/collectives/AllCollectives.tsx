import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { compact, isEmpty, isString, omit } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { CollectiveType } from '../../../../lib/constants/collectives';
import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { HostedCollectivesQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import type { Account, Collective } from '../../../../lib/graphql/types/v2/schema';
import { HostFeeStructure } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import formatCollectiveType from '../../../../lib/i18n/collective-type';

import { Drawer } from '../../../Drawer';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DataTable } from '../../../table/DataTable';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { consolidatedBalanceFilter } from '../../filters/BalanceFilter';
import { collectiveStatusFilter } from '../../filters/CollectiveStatusFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { hostsFilter } from '../../filters/HostsFilter';
import { Pagination } from '../../filters/Pagination';
import { searchFilter } from '../../filters/SearchFilter';
import { buildSortFilter } from '../../filters/SortFilter';
import type { DashboardSectionProps } from '../../types';

import CollectiveDetails from './CollectiveDetails';
import type { HostedCollectivesDataTableMeta } from './common';
import { cols } from './common';
import { allCollectivesQuery } from './queries';

const sortFilter = buildSortFilter({
  fieldSchema: z.enum(['CREATED_AT', 'BALANCE', 'NAME']),
  defaultValue: {
    field: 'CREATED_AT',
    direction: 'DESC',
  },
  i18nCustomLabels: {
    CREATED_AT: defineMessage({
      defaultMessage: 'Created',
      id: 'created',
    }),
  },
});

const COLLECTIVES_PER_PAGE = 20;

const schema = z.object({
  limit: integer.default(COLLECTIVES_PER_PAGE),
  offset: integer.default(0),
  searchTerm: searchFilter.schema,
  sort: sortFilter.schema,
  hostFeesStructure: z.nativeEnum(HostFeeStructure).optional(),
  type: isMulti(z.nativeEnum(CollectiveType)).optional(),
  status: collectiveStatusFilter.schema,
  consolidatedBalance: consolidatedBalanceFilter.schema,
  host: z.string().optional(),
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostedCollectivesQueryVariables> = {
  status: collectiveStatusFilter.toVariables,
  consolidatedBalance: consolidatedBalanceFilter.toVariables,
  host: hostsFilter.toVariables,
};

const filters: FilterComponentConfigs<z.infer<typeof schema>> = {
  sort: sortFilter.filter,
  searchTerm: searchFilter.filter,
  type: {
    labelMsg: defineMessage({ id: 'Type', defaultMessage: 'Type' }),
    Component: ({ intl, ...props }) => {
      const options = useMemo(
        () =>
          Object.values(CollectiveType).map(value => ({
            label: formatCollectiveType(intl, value),
            value,
          })),
        [intl],
      );
      return <ComboSelectFilter options={options} isMulti {...props} />;
    },
    valueRenderer: ({ value, intl }) => formatCollectiveType(intl, value),
  },
  status: collectiveStatusFilter.filter,
  host: hostsFilter.filter,
  consolidatedBalance: consolidatedBalanceFilter.filter,
};

const AllCollectives = ({ subpath }: Omit<DashboardSectionProps, 'accountSlug'>) => {
  const intl = useIntl();
  const router = useRouter();
  const [showCollectiveOverview, setShowCollectiveOverview] = React.useState<Account | undefined | string>(subpath[0]);
  const query = useMemo(() => omit(router.query, ['slug', 'section', 'subpath']), [router.query]);

  const pushSubpath = subpath => {
    router.push(
      {
        pathname: compact([router.pathname, router.query.slug, router.query.section, subpath]).join('/'),
        query,
      },
      undefined,
      {
        shallow: true,
      },
    );
  };

  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    meta: { currency: 'USD' },
  });

  const { data, error, loading, refetch } = useQuery(allCollectivesQuery, {
    variables: queryFilter.variables,
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
    skip: isEmpty(query),
  });

  useEffect(() => {
    if (subpath[0] !== ((showCollectiveOverview as Collective)?.id || showCollectiveOverview)) {
      handleDrawer(subpath[0]);
    }
  }, [subpath[0]]);

  const handleDrawer = (collective: Collective | string | undefined) => {
    if (collective) {
      pushSubpath(typeof collective === 'string' ? collective : collective.id);
    } else {
      pushSubpath(undefined);
    }
    setShowCollectiveOverview(collective);
  };

  const handleEdit = () => {
    refetch();
  };

  const hostedAccounts = data?.accounts;
  const onClickRow = row => handleDrawer(row.original);
  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader title={<FormattedMessage defaultMessage="All Collectives" id="uQguR/" />} />
      <Filterbar {...queryFilter} />
      {error && <MessageBoxGraphqlError error={error} mb={2} />}
      {!error && !loading && !hostedAccounts?.nodes.length && !isEmpty(query) ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="COLLECTIVES"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <DataTable
            data-cy="transactions-table"
            innerClassName="text-muted-foreground"
            columns={compact([cols.collective, cols.host, cols.team, cols.consolidatedBalance, cols.hostedSince])}
            data={hostedAccounts?.nodes || []}
            loading={loading}
            mobileTableView
            compact
            meta={
              {
                intl,
                onClickRow,
                onEdit: handleEdit,
                host: data?.host,
                openCollectiveDetails: handleDrawer,
              } as HostedCollectivesDataTableMeta
            }
            onClickRow={onClickRow}
            getRowDataCy={row => `collective-${row.original.slug}`}
          />
          <Pagination queryFilter={queryFilter} total={hostedAccounts?.totalCount} />
        </React.Fragment>
      )}

      <Drawer
        open={Boolean(showCollectiveOverview)}
        onClose={() => handleDrawer(null)}
        className={'max-w-2xl'}
        showActionsContainer
        showCloseButton
      >
        {showCollectiveOverview && (
          <CollectiveDetails
            collective={isString(showCollectiveOverview) ? null : showCollectiveOverview}
            collectiveId={isString(showCollectiveOverview) ? showCollectiveOverview : null}
            onCancel={() => handleDrawer(null)}
            openCollectiveDetails={handleDrawer}
            loading={loading}
            onEdit={handleEdit}
          />
        )}
      </Drawer>
    </div>
  );
};

export default AllCollectives;

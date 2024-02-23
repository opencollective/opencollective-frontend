import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { compact, isString, omit } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { CollectiveType, HostedCollectiveTypes } from '../../../../lib/constants/collectives';
import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { boolean, integer, isMulti } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { Collective, HostedCollectivesQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { HostFeeStructure } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { formatHostFeeStructure } from '../../../../lib/i18n/host-fee-structure';

import { DataTable } from '../../../DataTable';
import { Drawer } from '../../../Drawer';
import { Flex } from '../../../Grid';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import Pagination from '../../../Pagination';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { orderByFilter } from '../../filters/OrderFilter';
import { searchFilter } from '../../filters/SearchFilter';
import type { DashboardSectionProps } from '../../types';

import CollectiveDetails from './CollectiveDetails';
import { cols } from './common';
import { hostedCollectivesMetadataQuery, hostedCollectivesQuery } from './queries';

const COLLECTIVES_PER_PAGE = 20;

const schema = z.object({
  limit: integer.default(COLLECTIVES_PER_PAGE),
  offset: integer.default(0),
  searchTerm: searchFilter.schema,
  orderBy: orderByFilter.schema,
  hostFeesStructure: z.nativeEnum(HostFeeStructure).optional(),
  type: isMulti(z.nativeEnum(HostedCollectiveTypes)).optional(),
  isApproved: boolean.optional(),
  isFrozen: boolean.optional(),
  isUnhosted: boolean.optional(),
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostedCollectivesQueryVariables> = {
  orderBy: orderByFilter.toVariables,
};

const filters: FilterComponentConfigs<z.infer<typeof schema>> = {
  orderBy: orderByFilter.filter,
  searchTerm: searchFilter.filter,
  hostFeesStructure: {
    labelMsg: defineMessage({ id: 'FeeStructure', defaultMessage: 'Fee structure' }),
    Component: ({ intl, ...props }) => {
      const options = useMemo(
        () =>
          Object.values(omit(HostFeeStructure, HostFeeStructure.MONTHLY_RETAINER)).map(value => ({
            label: formatHostFeeStructure(intl, value),
            value,
          })),
        [intl],
      );
      return <ComboSelectFilter options={options} {...props} />;
    },
    valueRenderer: ({ value, intl }) => formatHostFeeStructure(intl, value),
  },
  type: {
    labelMsg: defineMessage({ id: 'Type', defaultMessage: 'Type' }),
    Component: ({ intl, ...props }) => {
      const options = useMemo(
        () =>
          Object.values(HostedCollectiveTypes).map(value => ({
            label: formatCollectiveType(intl, value),
            value,
          })),
        [intl],
      );
      return <ComboSelectFilter options={options} isMulti {...props} />;
    },
    valueRenderer: ({ value, intl }) => formatCollectiveType(intl, value),
  },
  isFrozen: {
    labelMsg: defineMessage({ defaultMessage: 'Frozen' }),
  },
  isApproved: {
    labelMsg: defineMessage({ defaultMessage: 'Approved' }),
  },
  isUnhosted: {
    labelMsg: defineMessage({ defaultMessage: 'Unhosted' }),
  },
};

const ROUTE_PARAMS = ['slug', 'section', 'view'];

const HostedCollectives = ({ accountSlug: hostSlug, subpath }: DashboardSectionProps) => {
  const intl = useIntl();
  const router = useRouter();
  const [showCollectiveOverview, setShowCollectiveOverview] = React.useState<Collective | undefined | string>(
    subpath[0],
  );
  const { data: metadata, refetch: refetchMetadata } = useQuery(hostedCollectivesMetadataQuery, {
    variables: { hostSlug },
    fetchPolicy: 'cache-and-network',
    context: API_V2_CONTEXT,
  });

  const pushSubpath = subpath => {
    router.push(
      {
        pathname: compact([router.pathname, router.query.slug, router.query.section, subpath]).join('/'),
        query: omit(router.query, ['slug', 'section', 'subpath']),
      },
      undefined,
      {
        shallow: true,
      },
    );
  };

  const views = [
    {
      id: 'all',
      label: intl.formatMessage({ defaultMessage: 'All' }),
      filter: {
        type: [CollectiveType.COLLECTIVE, CollectiveType.FUND],
      },
      count: metadata?.host?.all?.totalCount,
    },
    {
      id: 'active',
      label: intl.formatMessage({ defaultMessage: 'Active', id: 'Subscriptions.Active' }),
      filter: { isFrozen: false, type: [CollectiveType.COLLECTIVE, CollectiveType.FUND] },
      count: metadata?.host?.active?.totalCount,
    },
    {
      id: 'frozen',
      label: intl.formatMessage({ defaultMessage: 'Frozen' }),
      filter: { isFrozen: true, type: [CollectiveType.COLLECTIVE, CollectiveType.FUND] },
      count: metadata?.host?.frozen?.totalCount,
    },
    {
      id: 'unhosted',
      label: intl.formatMessage({ defaultMessage: 'Unhosted' }),
      filter: { isUnhosted: true, type: [CollectiveType.COLLECTIVE, CollectiveType.FUND] },
      count: metadata?.host?.unhosted?.totalCount,
    },
  ];

  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    views,
  });

  const { data, error, loading, variables, refetch } = useQuery(hostedCollectivesQuery, {
    variables: { hostSlug, ...queryFilter.variables },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
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
    refetchMetadata();
    refetch();
  };
  const isUnhosted = queryFilter.values?.isUnhosted === true;
  const hostedAccounts = data?.host?.hostedAccounts;

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader title={<FormattedMessage id="HostedCollectives" defaultMessage="Hosted Collectives" />} />
      <Filterbar {...queryFilter} />
      {error && <MessageBoxGraphqlError error={error} mb={2} />}
      {!error && !loading && !hostedAccounts?.nodes.length ? (
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
            columns={compact([
              cols.collective,
              cols.team,
              !isUnhosted && cols.fee,
              !isUnhosted && cols.hostedSince,
              cols.balance,
              cols.actions,
            ])}
            data={hostedAccounts?.nodes || []}
            loading={loading}
            mobileTableView
            compact
            meta={{ intl, openCollectiveDetails: handleDrawer, onEdit: handleEdit, host: data?.host }}
            onClickRow={row => handleDrawer(row.original)}
            getRowDataCy={row => `collective-${row.original.slug}`}
          />
          <Flex mt={5} justifyContent="center">
            <Pagination
              total={hostedAccounts?.totalCount}
              limit={variables.limit}
              offset={variables.offset}
              ignoredQueryParams={ROUTE_PARAMS}
            />
          </Flex>
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
            host={data?.host}
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

export default HostedCollectives;

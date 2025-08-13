import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { integer } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { HostFeeStructure } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import type { SubscriberFieldsFragment, SubscribersQueryVariables } from '@/lib/graphql/types/v2/graphql';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DataTable } from '../../../table/DataTable';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { accountTrustLevelFilter } from '../../filters/AccountTrustLevelFilter';
import { consolidatedBalanceFilter } from '../../filters/BalanceFilter';
import { collectiveStatusFilter } from '../../filters/CollectiveStatusFilter';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import { searchFilter } from '../../filters/SearchFilter';

import { cols, sortFilter, typeFilter } from './common';
import { subscribersQuery } from './queries';
import SubscriberModal from './SubscriberModal';

const COLLECTIVES_PER_PAGE = 20;

const schema = z.object({
  limit: integer.default(COLLECTIVES_PER_PAGE),
  offset: integer.default(0),
  searchTerm: searchFilter.schema,
  sort: sortFilter.schema,
  hostFeesStructure: z.nativeEnum(HostFeeStructure).optional(),
  type: typeFilter.schema,
  status: collectiveStatusFilter.schema,
  consolidatedBalance: consolidatedBalanceFilter.schema,
  trustLevel: accountTrustLevelFilter.schema,
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, SubscribersQueryVariables> = {
  status: collectiveStatusFilter.toVariables,
  consolidatedBalance: consolidatedBalanceFilter.toVariables,
  trustLevel: accountTrustLevelFilter.toVariables,
};

const filters: FilterComponentConfigs<z.infer<typeof schema>> = {
  sort: sortFilter.filter,
  searchTerm: searchFilter.filter,
  type: typeFilter.filter,
  trustLevel: accountTrustLevelFilter.filter,
};

const LegacyPlatformSubscribers = () => {
  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    meta: { currency: 'USD' },
  });

  const { data, error, loading } = useQuery(subscribersQuery, {
    variables: { ...queryFilter.variables, plan: ['LEGACY'] },
    context: API_V2_CONTEXT,
    fetchPolicy: 'network-only',
  });

  const [showPlanModal, setShowPlanModal] = React.useState<SubscriberFieldsFragment>(null);

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader title={<FormattedMessage id="menu.legacy-subscribers" defaultMessage="Legacy Subscribers" />} />

      <Filterbar {...queryFilter} />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !data.accounts?.nodes?.length ? (
        <EmptyResults hasFilters={queryFilter.hasFilters} onResetFilters={() => queryFilter.resetFilters({})} />
      ) : (
        <React.Fragment>
          <DataTable
            innerClassName="text-muted-foreground"
            columns={[cols.collective, cols.team, cols.moneyManaged, cols.legacyPlan, cols.createdAt, cols.actions]}
            data={data?.accounts?.nodes || []}
            loading={loading}
            mobileTableView
            compact
            meta={{
              onClickEdit: setShowPlanModal,
            }}
            getRowDataCy={row => `account-${row.original.slug}`}
          />
          <Pagination queryFilter={queryFilter} total={data?.accounts?.totalCount} />
        </React.Fragment>
      )}
      {!!showPlanModal && (
        <SubscriberModal
          open
          setOpen={open => setShowPlanModal(open ? showPlanModal : null)}
          account={showPlanModal}
          isLegacy
        />
      )}
    </div>
  );
};

export default LegacyPlatformSubscribers;

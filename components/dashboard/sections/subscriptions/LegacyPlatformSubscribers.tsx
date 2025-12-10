import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import type { SubscriberFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DataTable } from '../../../table/DataTable';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';

import { cols, filters, schema, toVariables } from './common';
import { subscribersQuery } from './queries';
import SubscriberPlanModal from './SubscriberPlanModal';

const LegacyPlatformSubscribers = () => {
  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    meta: { currency: 'USD' },
  });

  const { data, error, loading } = useQuery(subscribersQuery, {
    variables: { ...queryFilter.variables, plan: ['LEGACY'] },

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
            columns={[
              cols.collective,
              cols.team,
              cols.moneyManaged,
              cols.legacyPlan,
              cols.lastTransactionAt,
              cols.actions,
            ]}
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
        <SubscriberPlanModal
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

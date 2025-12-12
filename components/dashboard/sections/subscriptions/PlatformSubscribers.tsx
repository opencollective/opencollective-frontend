import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import type { SubscriberFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import { Sheet, SheetContent } from '@/components/ui/Sheet';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DataTable } from '../../../table/DataTable';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';

import { cols, filters, schema, toVariables } from './common';
import { subscribersQuery } from './queries';
import SubscriberDrawer from './SubscriberDrawer';
import SubscriberPlanModal from './SubscriberPlanModal';

const PAGE_ROUTE = '/dashboard/root-actions/subscribers';

const PlatformSubscribers = () => {
  const router = useRouter();
  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    meta: { currency: 'USD' },
  });

  const { data, error, loading } = useQuery(subscribersQuery, {
    variables: { ...queryFilter.variables, isPlatformSubscriber: true },

    fetchPolicy: 'network-only',
  });

  const [showPlanModal, setShowPlanModal] = React.useState<SubscriberFieldsFragment>(null);
  const subscriberDrawer = router.query?.subpath?.[0];
  const openDrawer = React.useCallback(
    id => router.push(`${PAGE_ROUTE}/${id}`, undefined, { shallow: true }),
    [router],
  );
  const closeDrawer = React.useCallback(() => router.push(`${PAGE_ROUTE}`, undefined, { shallow: true }), [router]);

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="menu.platform-subscribers" defaultMessage="Platform Subscribers" />}
      />

      <Filterbar {...queryFilter} />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !data.accounts?.nodes?.length ? (
        <EmptyResults hasFilters={queryFilter.hasFilters} onResetFilters={() => queryFilter.resetFilters({})} />
      ) : (
        <React.Fragment>
          <DataTable
            innerClassName="text-muted-foreground"
            columns={[cols.collective, cols.team, cols.moneyManaged, cols.plan, cols.actions]}
            data={data?.accounts?.nodes || []}
            loading={loading}
            mobileTableView
            compact
            meta={{
              onClickEdit: setShowPlanModal,
            }}
            getRowDataCy={row => `account-${row.original.slug}`}
            onClickRow={row => openDrawer(row.original.id)}
          />
          <Pagination queryFilter={queryFilter} total={data?.accounts?.totalCount} />
        </React.Fragment>
      )}
      {!!showPlanModal && (
        <SubscriberPlanModal
          open
          setOpen={open => setShowPlanModal(open ? showPlanModal : null)}
          account={showPlanModal}
        />
      )}
      {subscriberDrawer && (
        <Sheet open onOpenChange={closeDrawer}>
          <SheetContent className="max-w-2xl">
            <SubscriberDrawer id={subscriberDrawer} openPlanModal={setShowPlanModal} />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default PlatformSubscribers;

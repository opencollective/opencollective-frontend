import React, { useEffect, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import type { ColumnDef } from '@tanstack/react-table';
import { compact, isString, omit } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { FEATURES, requiresUpgrade } from '@/lib/allowed-features';
import { HostedCollectiveTypes } from '@/lib/constants/collectives';
import type { FilterComponentConfigs, FiltersToVariables } from '@/lib/filters/filter-types';
import { integer } from '@/lib/filters/schemas';
import type { HostedCollectiveFieldsFragment, HostedCollectivesQueryVariables } from '@/lib/graphql/types/v2/graphql';
import { HostFeeStructure } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { formatHostFeeStructure } from '@/lib/i18n/host-fee-structure';

import { Drawer } from '@/components/Drawer';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import { useModal } from '@/components/ModalContext';
import { UpgradePlanCTA } from '@/components/platform-subscriptions/UpgradePlanCTA';
import { DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/Button';

import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ExportHostedCollectivesCSVModal from '../../ExportHostedCollectivesCSVModal';
import { consolidatedBalanceFilter } from '../../filters/BalanceFilter';
import {
  COLLECTIVE_STATUS,
  collectiveStatusFilter,
  CollectiveStatusMessages,
} from '../../filters/CollectiveStatusFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { currencyFilter } from '../../filters/CurrencyFilter';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import { searchFilter } from '../../filters/SearchFilter';
import { buildSortFilter } from '../../filters/SortFilter';
import type { DashboardSectionProps } from '../../types';
import CollectiveDetails from '../collectives/CollectiveDetails';
import { cols, type HostedCollectivesDataTableMeta } from '../collectives/common';
import { hostedCollectivesQuery } from '../collectives/queries';

import { CreateFundModal } from './CreateFundModal';

const sortFilter = buildSortFilter({
  fieldSchema: z.enum(['CREATED_AT', 'BALANCE', 'NAME']),
  defaultValue: {
    field: 'CREATED_AT',
    direction: 'DESC',
  },
  i18nCustomLabels: {
    CREATED_AT: defineMessage({
      defaultMessage: 'Hosted since',
      id: 'HostedSince',
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
  type: z.enum([HostedCollectiveTypes.FUND]).default(HostedCollectiveTypes.FUND),
  status: collectiveStatusFilter.schema,
  consolidatedBalance: consolidatedBalanceFilter.schema,
  currencies: currencyFilter.schema,
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostedCollectivesQueryVariables> = {
  status: collectiveStatusFilter.toVariables,
  consolidatedBalance: consolidatedBalanceFilter.toVariables,
};

const filters: FilterComponentConfigs<z.infer<typeof schema>> = {
  sort: sortFilter.filter,
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
  currencies: currencyFilter.filter,
  status: collectiveStatusFilter.filter,
  consolidatedBalance: consolidatedBalanceFilter.filter,
};

export function HostedFunds({ accountSlug: hostSlug, subpath }: DashboardSectionProps) {
  const intl = useIntl();
  const router = useRouter();
  const { showModal } = useModal();
  const [displayExportCSVModal, setDisplayExportCSVModal] = React.useState(false);
  const [showCollectiveOverview, setShowCollectiveOverview] = React.useState<
    HostedCollectiveFieldsFragment | undefined | string
  >(subpath[0]);

  const { account } = React.useContext(DashboardContext);
  const isUpgradeRequired = requiresUpgrade(account, FEATURES.FUNDS_GRANTS_MANAGEMENT);

  const { data: metadata, refetch: refetchMetadata } = useQuery(
    gql`
      query HostedFundsMetadata($hostSlug: String!) {
        host(slug: $hostSlug) {
          id
          currency
          all: hostedAccounts(limit: 1, accountType: [FUND]) {
            totalCount
            currencies
          }
          active: hostedAccounts(limit: 1, accountType: [FUND], isFrozen: false) {
            totalCount
          }
          frozen: hostedAccounts(limit: 1, isFrozen: true, accountType: [FUND]) {
            totalCount
          }
          unhosted: hostedAccounts(limit: 1, accountType: [FUND], isUnhosted: true) {
            totalCount
          }
        }
      }
    `,
    {
      variables: { hostSlug },
      fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',

      skip: isUpgradeRequired,
    },
  );

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
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
      count: metadata?.host?.all?.totalCount,
    },
    {
      id: 'active',
      label: intl.formatMessage(CollectiveStatusMessages[COLLECTIVE_STATUS.ACTIVE]),
      filter: { status: COLLECTIVE_STATUS.ACTIVE },
      count: metadata?.host?.active?.totalCount,
    },
    {
      id: 'frozen',
      label: intl.formatMessage(CollectiveStatusMessages[COLLECTIVE_STATUS.FROZEN]),
      filter: { status: COLLECTIVE_STATUS.FROZEN },
      count: metadata?.host?.frozen?.totalCount,
    },
    {
      id: 'unhosted',
      label: intl.formatMessage(CollectiveStatusMessages[COLLECTIVE_STATUS.UNHOSTED]),
      filter: { status: COLLECTIVE_STATUS.UNHOSTED },
      count: metadata?.host?.unhosted?.totalCount,
    },
  ];

  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    views,
    meta: { currency: metadata?.host?.currency, currencies: metadata?.host?.all?.currencies },
  });

  const { data, error, loading, refetch } = useQuery(hostedCollectivesQuery, {
    variables: { hostSlug, ...queryFilter.variables },

    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
    skip: isUpgradeRequired,
  });

  useEffect(() => {
    if (subpath[0] !== ((showCollectiveOverview as HostedCollectiveFieldsFragment)?.id || showCollectiveOverview)) {
      handleDrawer(subpath[0]);
    }
  }, [subpath[0]]);

  const handleDrawer = (collective: HostedCollectiveFieldsFragment | string | undefined) => {
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
  const isUnhosted = queryFilter.values?.status === COLLECTIVE_STATUS.UNHOSTED;
  const hostedAccounts = data?.host?.hostedAccounts;
  const onClickRow = row => handleDrawer(row.original);
  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Hosted Funds" id="HostedFunds" />}
        actions={
          <React.Fragment>
            <ExportHostedCollectivesCSVModal
              open={displayExportCSVModal}
              setOpen={setDisplayExportCSVModal}
              queryFilter={queryFilter}
              account={data?.host}
              isHostReport
              trigger={
                <Button
                  size="sm"
                  disabled={isUpgradeRequired}
                  variant="outline"
                  onClick={() => setDisplayExportCSVModal(true)}
                >
                  <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
                </Button>
              }
            />
            <Button
              onClick={() => {
                showModal(CreateFundModal, { hostSlug });
              }}
              size="sm"
              variant="outline"
              disabled={isUpgradeRequired}
            >
              <FormattedMessage defaultMessage="Create fund" id="0frjVr" />
            </Button>
          </React.Fragment>
        }
      />
      {isUpgradeRequired ? (
        <UpgradePlanCTA featureKey={FEATURES.FUNDS_GRANTS_MANAGEMENT} />
      ) : (
        <React.Fragment>
          <Filterbar {...queryFilter} />

          {error && <MessageBoxGraphqlError error={error} mb={2} />}
          {!error && !loading && !hostedAccounts?.nodes.length ? (
            <EmptyResults
              hasFilters={queryFilter.hasFilters}
              entityType="FUNDS"
              onResetFilters={() => queryFilter.resetFilters({})}
            />
          ) : (
            <React.Fragment>
              <DataTable
                data-cy="funds-table"
                innerClassName="text-muted-foreground"
                columns={compact([
                  {
                    ...cols.collective,
                    header: () => <FormattedMessage defaultMessage="Fund name" id="nPLfxb" />,
                  } as ColumnDef<any, any>,
                  cols.team,
                  !isUnhosted && cols.fee,
                  !isUnhosted && cols.hostedSince,
                  cols.totalAmountRaised,
                  cols.totalAmountSpent,
                  cols.consolidatedBalance,
                  cols.actions,
                ])}
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
            collective={isString(showCollectiveOverview) ? null : (showCollectiveOverview as any)}
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
}

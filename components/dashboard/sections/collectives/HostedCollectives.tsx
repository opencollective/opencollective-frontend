import React, { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { compact, isString, omit } from 'lodash-es';
import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { CollectiveType, HostedCollectiveTypes } from '../../../../lib/constants/collectives';
import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import type { Account, HostedCollectivesQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { HostFeeStructure } from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { formatHostFeeStructure } from '../../../../lib/i18n/host-fee-structure';
import { PREVIEW_FEATURE_KEYS } from '../../../../lib/preview-features';

import { Drawer } from '../../../Drawer';
import { HostedAccountProfile } from '../../../hosted-account-overview/HostedAccountProfile';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DataTable } from '../../../table/DataTable';
import { Button } from '../../../ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';
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
import { dateFilter } from '../../filters/DateFilter';
import { dateToVariables } from '../../filters/DateFilter/schema';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import { searchFilter } from '../../filters/SearchFilter';
import { buildSortFilter } from '../../filters/SortFilter';
import type { DashboardSectionProps } from '../../types';
import { makePushSubpath } from '../../utils';

import CollectiveDetails from './CollectiveDetails';
import type { HostedCollectivesDataTableMeta } from './common';
import { cols } from './common';
import CreateHostedCollectiveModal from './CreateHostedCollectiveModal';
import { metricFilterConfigs, metricFilterSchema, metricFilterToVariables } from './metric-filters';
import { hostedCollectivesMetadataQuery, hostedCollectivesQuery } from './queries';

const sortFilter = buildSortFilter({
  fieldSchema: z.enum(['CREATED_AT', 'BALANCE', 'NAME', 'UNHOSTED_AT', 'STARTS_AT']),
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

const startsAtDateFilter = {
  ...dateFilter,
  toVariables: value => dateToVariables(value, 'startsAt'),
  filter: {
    ...dateFilter.filter,
    labelMsg: defineMessage({ defaultMessage: 'Event Starts Date', id: 'EventStartsDate' }),
  },
};

const schema = z.object({
  limit: integer.default(COLLECTIVES_PER_PAGE),
  offset: integer.default(0),
  searchTerm: searchFilter.schema,
  sort: sortFilter.schema,
  hostFeesStructure: z.nativeEnum(HostFeeStructure).optional(),
  type: isMulti(z.nativeEnum(HostedCollectiveTypes)).optional(),
  status: collectiveStatusFilter.schema,
  consolidatedBalance: consolidatedBalanceFilter.schema,
  currencies: currencyFilter.schema,
  startsAt: startsAtDateFilter.schema,
  ...metricFilterSchema,
});

type Schema = z.infer<typeof schema>;

const toVariables: FiltersToVariables<Schema, HostedCollectivesQueryVariables> = {
  status: collectiveStatusFilter.toVariables,
  consolidatedBalance: consolidatedBalanceFilter.toVariables,
  startsAt: startsAtDateFilter.toVariables,
  ...metricFilterToVariables,
};

const filters: FilterComponentConfigs<Schema> = {
  sort: sortFilter.filter,
  searchTerm: searchFilter.filter,
  ...metricFilterConfigs,
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
          Object.values(HostedCollectiveTypes)
            .filter(type => type !== HostedCollectiveTypes.FUND)
            .map(value => ({
              label: formatCollectiveType(intl, value),
              value,
            })),
        [intl],
      );
      return <ComboSelectFilter options={options} isMulti {...props} />;
    },
    valueRenderer: ({ value, intl }) => formatCollectiveType(intl, value),
  },
  currencies: currencyFilter.filter,
  status: collectiveStatusFilter.filter,
  consolidatedBalance: consolidatedBalanceFilter.filter,
  startsAt: startsAtDateFilter.filter,
};

const HostedCollectivesList = ({ accountSlug: hostSlug, subpath }: DashboardSectionProps) => {
  const intl = useIntl();
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const hasAccountProfile = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.HOSTED_ACCOUNT_OVERVIEW);
  const [displayExportCSVModal, setDisplayExportCSVModal] = React.useState(false);
  const [showCollectiveOverview, setShowCollectiveOverview] = React.useState<Account | undefined | string>(
    subpath?.[0],
  );
  const [createCollective, setCreateCollective] = React.useState(false);
  const accountTypes = [CollectiveType.COLLECTIVE];

  const { data: metadata, refetch: refetchMetadata } = useQuery(hostedCollectivesMetadataQuery, {
    variables: { hostSlug, accountTypes },
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const pushSubpath = makePushSubpath(router);

  const handleDrawer = (collective: Account | string | undefined) => {
    pushSubpath(collective ? (typeof collective === 'string' ? collective : collective.id) : undefined);
    setShowCollectiveOverview(collective);
  };

  React.useEffect(() => {
    if (!hasAccountProfile && subpath?.[0] !== ((showCollectiveOverview as Account)?.id || showCollectiveOverview)) {
      handleDrawer(subpath?.[0]);
    }
  }, [subpath?.[0], hasAccountProfile]);

  const views = [
    {
      id: 'all',
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {
        type: accountTypes,
      },
      count: metadata?.host?.all?.totalCount,
    },
    {
      id: 'active',
      label: intl.formatMessage(CollectiveStatusMessages[COLLECTIVE_STATUS.ACTIVE]),
      filter: {
        status: COLLECTIVE_STATUS.ACTIVE,
        type: accountTypes,
      },
      count: metadata?.host?.active?.totalCount,
    },
    {
      id: 'frozen',
      label: intl.formatMessage(CollectiveStatusMessages[COLLECTIVE_STATUS.FROZEN]),
      filter: {
        status: COLLECTIVE_STATUS.FROZEN,
        type: accountTypes,
      },
      count: metadata?.host?.frozen?.totalCount,
    },
    {
      id: 'unhosted',
      label: intl.formatMessage(CollectiveStatusMessages[COLLECTIVE_STATUS.UNHOSTED]),
      filter: {
        status: COLLECTIVE_STATUS.UNHOSTED,
        type: accountTypes,
      },
      count: metadata?.host?.unhosted?.totalCount,
    },
  ];

  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    views,
    meta: {
      currency: metadata?.host?.currency,
      currencies: metadata?.host?.all?.currencies,
    },
  });

  const { data, error, loading, refetch } = useQuery(hostedCollectivesQuery, {
    variables: { hostSlug, ...queryFilter.variables },
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const handleEdit = () => {
    refetchMetadata();
    refetch();
  };
  const isUnhosted = queryFilter.values?.status === COLLECTIVE_STATUS.UNHOSTED;
  const hostedAccounts = data?.host?.hostedAccounts;
  const isBlockedForUnpaidBilling = Boolean(
    data?.host && 'platformSubscription' in data.host && data.host.platformSubscription?.isAccountOnHold,
  );
  const onClickRow = hasAccountProfile ? row => pushSubpath(row.original.publicId) : row => handleDrawer(row.original);
  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="Collectives" defaultMessage="Collectives" />}
        className="mb-6"
        description={
          <FormattedMessage defaultMessage="Collectives you currently host or have hosted in the past." id="nTMHB4" />
        }
        actions={
          <React.Fragment>
            <ExportHostedCollectivesCSVModal
              open={displayExportCSVModal}
              setOpen={setDisplayExportCSVModal}
              queryFilter={queryFilter}
              account={data?.host}
              isHostReport
              trigger={
                <Button size="sm" variant="outline" onClick={() => setDisplayExportCSVModal(true)}>
                  <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
                </Button>
              }
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => setCreateCollective(true)}
                    disabled={isBlockedForUnpaidBilling}
                    data-cy="create-collective-btn"
                  >
                    <span>
                      <FormattedMessage defaultMessage="Create collective" id="CreateCollective" />
                    </span>
                    <PlusIcon size={20} />
                  </Button>
                </span>
              </TooltipTrigger>
              {isBlockedForUnpaidBilling && (
                <TooltipContent>
                  <FormattedMessage defaultMessage="This action is currently not available" id="kl8uy/" />
                </TooltipContent>
              )}
            </Tooltip>
          </React.Fragment>
        }
      />
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
              isUnhosted && cols.unhostedAt,
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
              } as unknown as HostedCollectivesDataTableMeta
            }
            onClickRow={onClickRow}
            getRowDataCy={row => `collective-${row.original.slug}`}
          />
          <Pagination queryFilter={queryFilter} total={hostedAccounts?.totalCount} />
        </React.Fragment>
      )}

      {createCollective && (
        <CreateHostedCollectiveModal
          hostSlug={hostSlug}
          isPrivate={data?.host?.isPrivate ?? false}
          onClose={() => setCreateCollective(false)}
          onSuccess={() => {
            refetchMetadata();
            refetch();
          }}
        />
      )}

      <Drawer
        open={Boolean(!hasAccountProfile && showCollectiveOverview)}
        onClose={() => handleDrawer(undefined)}
        className={'max-w-2xl'}
        showActionsContainer
        showCloseButton
      >
        {showCollectiveOverview && (
          <CollectiveDetails
            collective={isString(showCollectiveOverview) ? null : (showCollectiveOverview as any)}
            collectiveId={isString(showCollectiveOverview) ? showCollectiveOverview : null}
            host={data?.host}
            onCancel={() => handleDrawer(undefined)}
            openCollectiveDetails={handleDrawer}
            loading={loading}
            onEdit={handleEdit}
          />
        )}
      </Drawer>
    </div>
  );
};

const HostedCollectives = (props: DashboardSectionProps) => {
  const { LoggedInUser } = useLoggedInUser();
  const hasAccountProfile = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.HOSTED_ACCOUNT_OVERVIEW);
  const collectiveId = props.subpath?.[0];
  if (hasAccountProfile && collectiveId) {
    return <HostedAccountProfile hostSlug={props.accountSlug} accountId={collectiveId} />;
  }
  return <HostedCollectivesList {...props} />;
};

export default HostedCollectives;

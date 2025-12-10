import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { compact, isUndefined, omit } from 'lodash';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { integer } from '../../../../lib/filters/schemas';
import type {
  DashboardAccountsQueryFieldsFragment,
  HostedCollectivesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { useDrawer } from '@/lib/hooks/useDrawer';
import formatCollectiveType from '@/lib/i18n/collective-type';

import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { useModal } from '@/components/ModalContext';

import Link from '../../../Link';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import { Button } from '../../../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';
import { Skeleton } from '../../../ui/Skeleton';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { ACCOUNT_STATUS, accountStatusFilter } from '../../filters/AccountStatusFilter';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';

import AccountDrawer from './AccountDrawer';
import { useAccountActions } from './actions';
import { AddFundsModalAccount, cols } from './common';
import InternalTransferModal from './InternalTransferModal';
import { accountsMetadataQuery, accountsQuery } from './queries';
const COLLECTIVES_PER_PAGE = 20;

const schema = z.object({
  limit: integer.default(COLLECTIVES_PER_PAGE),
  offset: integer.default(0),
  status: accountStatusFilter.schema,
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostedCollectivesQueryVariables> = {
  status: accountStatusFilter.toVariables,
};

const filters: FilterComponentConfigs<z.infer<typeof schema>> = {
  status: accountStatusFilter.filter,
};

const Accounts = ({ accountSlug, subpath }: DashboardSectionProps) => {
  const intl = useIntl();
  const router = useRouter();
  const { data: metadata } = useQuery(accountsMetadataQuery, {
    variables: { accountSlug },
    fetchPolicy: 'cache-and-network',
  });
  const { account } = useContext(DashboardContext);
  const openAccountId = subpath[0];

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
      count: !isUndefined(metadata?.account?.all?.totalCount) ? metadata.account.all.totalCount + 1 : undefined,
      filter: {},
    },
    {
      id: 'active',
      label: intl.formatMessage({ id: 'Subscriptions.Active', defaultMessage: 'Active' }),
      filter: { status: ACCOUNT_STATUS.ACTIVE },
      count: !isUndefined(metadata?.account?.active?.totalCount) ? metadata.account.active.totalCount + 1 : undefined,
    },
    {
      id: 'archived',
      label: intl.formatMessage({ defaultMessage: 'Archived', id: '0HT+Ib' }),
      filter: { status: ACCOUNT_STATUS.ARCHIVED },
      count: metadata?.account?.archived?.totalCount,
    },
  ];

  const queryFilter = useQueryFilter({
    filters,
    schema,
    views,
    toVariables,
    defaultFilterValues: views[1].filter,
    meta: { currency: metadata?.host?.currency },
  });

  const { data, error, loading } = useQuery(accountsQuery, {
    variables: { accountSlug, ...queryFilter.variables },
  });

  const { openDrawer, drawerProps } = useDrawer({
    open: Boolean(openAccountId),
    onOpen: id => pushSubpath(id),
    onClose: () => pushSubpath(undefined),
  });

  const isAllowedAddFunds = Boolean(data?.account?.permissions?.addFunds?.allowed) && data?.account.isHost;

  const { showModal } = useModal();

  const isArchived = queryFilter.hasFilters && queryFilter.values.status === ACCOUNT_STATUS.ARCHIVED;
  const accounts = compact([!isArchived && data?.account, ...(data?.account?.childrenAccounts?.nodes || [])]);
  const activeAccounts = React.useMemo(
    () => [data?.account, ...(data?.account?.childrenAccounts?.nodes.filter(a => a.isActive) || [])],
    [data?.account],
  );
  const getActions = useAccountActions<DashboardAccountsQueryFieldsFragment>({
    accounts: activeAccounts,
  });

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Accounts" id="FvanT6" />}
        description={
          <FormattedMessage
            defaultMessage="Manage the accounts in your {collectiveType}."
            id="vPnM7w"
            values={{ collectiveType: formatCollectiveType(intl, account.type) }}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="xs" variant="outline" className="gap-1">
                  <FormattedMessage id="Accounts.Add" defaultMessage="Add Account" />
                  <ChevronDown className="text-muted-foreground" size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${accountSlug}/projects/create`}>
                    <FormattedMessage defaultMessage="New project" id="lJMkin" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${accountSlug}/events/create`}>
                    <FormattedMessage defaultMessage="New event" id="C+Npdp" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {activeAccounts?.length > 1 && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  showModal(InternalTransferModal, { parentAccount: data?.account }, 'internal-transfer-modal');
                }}
              >
                <FormattedMessage defaultMessage="New internal transfer" id="v4unZI" />
              </Button>
            )}
            {isAllowedAddFunds && (
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  showModal(AddFundsModalAccount, { collective: data?.account, host: data?.host }, 'add-funds-modal')
                }
              >
                <FormattedMessage defaultMessage="Add funds" id="sx0aSl" />
              </Button>
            )}
          </div>
        }
      >
        <div className="mt-2 w-full max-w-xs space-y-1 rounded-lg border p-3">
          <div>
            <div className="flex items-center gap-1">
              <span className="block text-sm font-medium tracking-tight">
                <FormattedMessage id="TotalBalance" defaultMessage="Total Balance" />
              </span>
            </div>

            {loading ? (
              <Skeleton className="mt-1 h-7 w-1/2" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="block text-2xl font-bold">
                  <FormattedMoneyAmount
                    amount={data?.account?.stats?.consolidatedBalance?.valueInCents}
                    currency={data?.account?.stats?.consolidatedBalance?.currency}
                    precision={2}
                    showCurrencyCode={true}
                  />
                </span>
              </div>
            )}
          </div>
        </div>
      </DashboardHeader>
      <Filterbar {...queryFilter} />
      {error && <MessageBoxGraphqlError error={error} mb={2} />}
      {!error && !loading && !accounts?.length ? (
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
            columns={compact([cols.collective, cols.balance, actionsColumn])}
            data={accounts}
            loading={loading}
            mobileTableView
            onClickRow={(row, menuRef) => openDrawer(row.id, menuRef)}
            getRowDataCy={row => `collective-${row.original.slug}`}
            getActions={getActions}
            queryFilter={queryFilter}
            getRowId={row => String(row.id)}
          />
          <Pagination queryFilter={queryFilter} total={data?.account?.childrenAccounts?.totalCount} />
        </React.Fragment>
      )}

      <AccountDrawer {...drawerProps} accountId={openAccountId} getActions={getActions} />
    </div>
  );
};

export default Accounts;

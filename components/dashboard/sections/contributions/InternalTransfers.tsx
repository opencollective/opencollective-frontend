import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { defineMessage, FormattedMessage } from 'react-intl';
import type { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import type { Account, DashboardOrdersQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { OppositeAccountScope } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { AccountOrdersFilter } from '@/lib/graphql/types/v2/schema';

import { useModal } from '../../../ModalContext';
import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { childAccountFilter } from '../../filters/ChildAccountFilter';
import type { DashboardSectionProps } from '../../types';
import InternalTransferModal from '../accounts/InternalTransferModal';

import { columns } from './columns';
import ContributionsTable from './ContributionsTable';
import type { FilterMeta as BaseFilterMeta } from './filters';
import {
  ContributionAccountingCategoryKinds,
  filters as baseFilters,
  schema as baseSchema,
  toVariables as baseToVariables,
} from './filters';
import { dashboardOrdersQuery } from './queries';

const schema = baseSchema.extend({ account: childAccountFilter.schema });

type FilterValues = z.infer<typeof schema>;
type FilterMeta = BaseFilterMeta & {
  childrenAccounts?: Account[];
};

const toVariables: FiltersToVariables<FilterValues, DashboardOrdersQueryVariables, FilterMeta> = {
  ...baseToVariables,
  account: (value, key, meta) => {
    if (meta?.childrenAccounts && !meta.childrenAccounts.length) {
      return { includeChildrenAccounts: false };
    } else if (!value) {
      return { includeChildrenAccounts: true };
    } else {
      return { slug: value, includeChildrenAccounts: false };
    }
  },
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...baseFilters,
  account: childAccountFilter.filter,
};

const internalTransferColumns = columns.map(col => {
  if ('accessorKey' in col && col.accessorKey === 'fromAccount') {
    return { ...col, meta: { ...col.meta, labelMsg: defineMessage({ defaultMessage: 'From', id: 'dM+p3/' }) } };
  }
  if ('accessorKey' in col && col.accessorKey === 'toAccount') {
    return { ...col, meta: { ...col.meta, labelMsg: defineMessage({ defaultMessage: 'To', id: 'To' }) } };
  }
  return col;
});

const InternalTransfers = ({ accountSlug }: DashboardSectionProps) => {
  const { account } = useContext(DashboardContext);
  const { showModal } = useModal();

  const activeAccounts = React.useMemo(
    () => [account, ...(account.childrenAccounts?.nodes?.filter(a => a.isActive) || [])],
    [account],
  );

  const filterMeta: FilterMeta = {
    currency: account.currency,
    accountSlug: account.slug,
    childrenAccounts: account.childrenAccounts?.nodes ?? [],
    hostSlug: account.isHost ? account.slug : undefined,
    includeUncategorized: true,
    accountingCategoryKinds: ContributionAccountingCategoryKinds,
    manualPaymentProviders: account.manualPaymentProviders ?? account.host?.manualPaymentProviders ?? undefined,
  };

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    meta: filterMeta,
    filters,
  });

  const baseVars = {
    slug: accountSlug,
    filter: AccountOrdersFilter.INCOMING,
    oppositeAccountScope: OppositeAccountScope.INTERNAL,
  };

  const { data, loading, error, refetch } = useQuery(dashboardOrdersQuery, {
    variables: {
      ...baseVars,
      includeIncognito: true,
      includeChildrenAccounts: true,
      ...queryFilter.variables,
    },
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });

  const handleRefetch = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const nbPlaceholders =
    (data?.account?.orders?.totalCount ?? 0) < queryFilter.values.limit
      ? (data?.account?.orders?.totalCount ?? 0)
      : queryFilter.values.limit;

  const orders = data?.account?.orders ?? { nodes: [], totalCount: 0 };

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="InternalTransfers" defaultMessage="Internal Transfers" />}
        description={
          <FormattedMessage
            id="InternalTransfers.description"
            defaultMessage="Money moved (using contributions) within your organization."
          />
        }
        actions={
          activeAccounts.length > 1 && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                showModal(InternalTransferModal, { parentAccount: account }, 'internal-transfer-modal');
              }}
            >
              <FormattedMessage defaultMessage="New internal transfer" id="v4unZI" />
            </Button>
          )
        }
      />

      <ContributionsTable
        accountSlug={accountSlug}
        queryFilter={queryFilter}
        orders={orders}
        columns={internalTransferColumns}
        loading={loading}
        nbPlaceholders={nbPlaceholders}
        error={error}
        refetch={handleRefetch}
      />
    </div>
  );
};

export default InternalTransfers;

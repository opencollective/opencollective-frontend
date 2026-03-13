import React from 'react';
import { useQuery } from '@apollo/client';
import { useIntl } from 'react-intl';
import { z } from 'zod';

import type { FiltersToVariables } from '@/lib/filters/filter-types';
import { limit, offset } from '@/lib/filters/schemas';
import type { TransactionsTableQueryVariables } from '@/lib/graphql/types/v2/graphql';
import { TransactionKind, TransactionType } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';

import { EmptyResults } from '../../EmptyResults';
import { accountingCategoryFilter } from '../../filters/AccountingCategoryFilter';
import { amountFilter } from '../../filters/AmountFilter';
import { dateFilter } from '../../filters/DateFilter';
import { Filterbar } from '../../filters/Filterbar';
import { hostedAccountFilter } from '../../filters/HostedAccountFilter';
import { searchFilter } from '../../filters/SearchFilter';
import { buildSortFilter } from '../../filters/SortFilter';
import {
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from '../transactions/filters';
import { transactionsTableQuery } from '../transactions/queries';
import TransactionsTable from '../transactions/TransactionsTable';

const schema = z.object({
  limit: limit.default(15),
  offset,
  date: dateFilter.schema,
  amount: amountFilter.schema,
  sort: buildSortFilter({
    fieldSchema: z.enum(['CREATED_AT', 'EFFECTIVE_DATE']),
    defaultValue: {
      field: 'CREATED_AT',
      direction: 'DESC',
    },
  }).schema,
  searchTerm: searchFilter.schema,
  type: z.nativeEnum(TransactionType).optional(),
  kind: commonSchema.shape.kind,
  openTransactionId: z.coerce.string().optional(),
  account: hostedAccountFilter.schema,
  accountingCategory: accountingCategoryFilter.schema,
});

type FilterValues = z.infer<typeof schema>;

const toVariables: FiltersToVariables<FilterValues, TransactionsTableQueryVariables> = {
  date: commonToVariables.date,
  amount: commonToVariables.amount,
  account: hostedAccountFilter.toVariables,
};

const filters = {
  searchTerm: commonFilters.searchTerm,
  date: commonFilters.date,
  sort: commonFilters.sort,
  amount: commonFilters.amount,
  type: commonFilters.type,
  kind: commonFilters.kind,
  account: hostedAccountFilter.filter,
  accountingCategory: accountingCategoryFilter.filter,
};

enum TransactionsView {
  ALL = 'ALL',
  PAYOUTS = 'PAYOUTS',
  CONTRIBUTIONS = 'CONTRIBUTIONS',
}

type AccountDetailTransactionsTabProps = {
  account: { id: string };
  hostSlug: string;
};

export function AccountDetailTransactionsTab({ account, hostSlug }: AccountDetailTransactionsTabProps) {
  const intl = useIntl();

  const views = React.useMemo(
    () => [
      {
        id: TransactionsView.ALL,
        label: intl.formatMessage({ defaultMessage: 'All', id: 'All' }),
        filter: {},
      },
      {
        id: TransactionsView.CONTRIBUTIONS,
        label: intl.formatMessage({ defaultMessage: 'Contributions', id: 'Contributions' }),
        filter: { kind: [TransactionKind.ADDED_FUNDS, TransactionKind.CONTRIBUTION] },
      },
      {
        id: TransactionsView.PAYOUTS,
        label: intl.formatMessage({ defaultMessage: 'Payouts', id: 'Payouts' }),
        filter: { kind: [TransactionKind.EXPENSE] },
      },
    ],
    [intl],
  );

  const queryFilter = useQueryFilter<typeof schema, TransactionsTableQueryVariables>({
    schema,
    toVariables,
    filters,
    views,
    skipRouter: true,
    meta: {
      hostSlug: hostSlug,
    },
  });

  const { data, error, loading, refetch } = useQuery(transactionsTableQuery, {
    variables: {
      fromAccount: { id: account.id },
      hostAccount: { slug: hostSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: false,
      ...queryFilter.variables,
    },
    notifyOnNetworkStatusChange: true,
  });

  const transactions = data?.transactions;

  return (
    <div className="flex flex-col gap-4">
      <Filterbar hideCounts {...queryFilter} />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !transactions?.nodes?.length ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="TRANSACTIONS"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <TransactionsTable
            transactions={transactions}
            loading={loading}
            nbPlaceholders={queryFilter.values.limit}
            queryFilter={queryFilter}
            refetchList={refetch}
          />
        </React.Fragment>
      )}
    </div>
  );
}

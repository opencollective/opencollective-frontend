import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';
import type { z } from 'zod';

import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import type { FilterComponentConfigs, FiltersToVariables } from '@/lib/filters/filter-types';
import type { TransactionsTableQueryVariables, WorkspaceSubFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ExportTransactionsCSVModal from '../../ExportTransactionsCSVModal';
import { childAccountFilter } from '../../filters/ChildAccountFilter';
import { Filterbar } from '../../filters/Filterbar';
import type { DashboardSectionProps } from '../../types';

import type { FilterMeta as CommonFilterMeta } from './filters';
import { filters as commonFilters, schema as commonSchema, toVariables as commonToVariables } from './filters';
import { transactionsTableQuery } from './queries';
import TransactionsTable from './TransactionsTable';

type FilterMeta = CommonFilterMeta & {
  childrenAccounts: WorkspaceSubFieldsFragment[];
  accountSlug: string;
};

export const schema = commonSchema.extend({
  account: childAccountFilter.schema,
});

type FilterValues = z.infer<typeof schema>;

export const toVariables: FiltersToVariables<FilterValues, TransactionsTableQueryVariables, FilterMeta> = {
  ...commonToVariables,
  account: (value, key, meta) => {
    if (meta?.childrenAccounts && !meta.childrenAccounts.length) {
      return { includeChildrenTransactions: false };
    } else if (!value) {
      return { includeChildrenTransactions: true };
    } else {
      return {
        account: { slug: value },
        includeChildrenTransactions: false,
      };
    }
  },
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...commonFilters,
  account: childAccountFilter.filter,
};

const accountTransactionsMetaDataQuery = gql`
  query AccountTransactionsMetaData($slug: String!) {
    transactions(account: { slug: $slug }, limit: 0) {
      paymentMethodTypes
      kinds
    }
    account(slug: $slug) {
      id
      name
      legacyId
      slug
      currency
      settings
      type
      childrenAccounts {
        totalCount
        nodes {
          id
        }
      }
    }
  }
`;

const AccountTransactions = ({ accountSlug }: DashboardSectionProps) => {
  const { account } = React.useContext(DashboardContext);

  const [displayExportCSVModal, setDisplayExportCSVModal] = React.useState(false);
  const { data: metaData } = useQuery(accountTransactionsMetaDataQuery, {
    variables: { slug: accountSlug },

    fetchPolicy: 'cache-first',
  });

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    filters,
    meta: {
      currency: metaData?.account?.currency,
      paymentMethodTypes: metaData?.transactions?.paymentMethodTypes,
      kinds: metaData?.transactions?.kinds,
      accountSlug,
      childrenAccounts: account.childrenAccounts?.nodes ?? [],
    },
  });

  const { data, error, loading, refetch } = useQuery(transactionsTableQuery, {
    variables: {
      account: { slug: accountSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: true,
      ...queryFilter.variables,
    },
    notifyOnNetworkStatusChange: true,
  });

  const { transactions } = data || {};

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="menu.transactions" defaultMessage="Transactions" />}
        actions={
          <ExportTransactionsCSVModal
            open={displayExportCSVModal}
            setOpen={setDisplayExportCSVModal}
            queryFilter={queryFilter}
            account={metaData?.account}
            trigger={
              <Button size="sm" variant="outline" onClick={() => setDisplayExportCSVModal(true)}>
                <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
              </Button>
            }
          />
        }
      />

      <Filterbar {...queryFilter} />
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
};

export default AccountTransactions;

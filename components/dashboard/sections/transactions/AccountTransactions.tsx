import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import { Flex } from '../../../Grid';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import Pagination from '../../../Pagination';
import { Button } from '../../../ui/Button';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ExportTransactionsCSVModal from '../../ExportTransactionsCSVModal';
import { Filterbar } from '../../filters/Filterbar';
import type { DashboardSectionProps } from '../../types';

import { filters, schema, toVariables } from './filters';
import { transactionsTableQuery } from './queries';
import { TransactionDrawer } from './TransactionDrawer';
import TransactionsTable from './TransactionsTable';

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
    }
  }
`;

const AccountTransactions = ({ accountSlug }: DashboardSectionProps) => {
  const [displayExportCSVModal, setDisplayExportCSVModal] = React.useState(false);
  const [transactionInDrawer, setTransactionInDrawer] = React.useState(null);

  const { data: metaData } = useQuery(accountTransactionsMetaDataQuery, {
    variables: { slug: accountSlug },
    context: API_V2_CONTEXT,
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
    },
  });

  const { data, previousData, error, loading, refetch } = useQuery(transactionsTableQuery, {
    variables: {
      account: { slug: accountSlug },
      includeIncognitoTransactions: true,
      includeChildrenTransactions: true,
      ...queryFilter.variables,
    },
    notifyOnNetworkStatusChange: true,
    context: API_V2_CONTEXT,
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
            nbPlaceholders={20}
            onClickRow={row => {
              setTransactionInDrawer(row);
              queryFilter.setFilter('openTransactionId', row.id);
            }}
          />
          <Flex mt={5} justifyContent="center">
            <Pagination
              route={`/dashboard/${accountSlug}/transactions`}
              total={(data || previousData)?.transactions?.totalCount}
              limit={queryFilter.values.limit}
              offset={queryFilter.values.offset}
              ignoredQueryParams={['collectiveSlug']}
            />
          </Flex>
        </React.Fragment>
      )}
      <TransactionDrawer
        open={!!queryFilter.values.openTransactionId}
        transaction={transactionInDrawer}
        setFilter={queryFilter.setFilter}
        resetFilters={queryFilter.resetFilters}
        setOpen={open => {
          if (!open) {
            queryFilter.setFilter('openTransactionId', undefined);
          }
        }}
        transactionId={queryFilter.values.openTransactionId}
        refetchList={refetch}
      />
    </div>
  );
};

export default AccountTransactions;

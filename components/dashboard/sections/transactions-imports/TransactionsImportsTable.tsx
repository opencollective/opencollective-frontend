import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { integer } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { TransactionsImport } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { capitalize } from '../../../../lib/utils';
import { TransactionImportListFieldsFragment } from './lib/graphql';

import DateTime from '../../../DateTime';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import DashboardHeader from '../../DashboardHeader';
import { Pagination } from '../../filters/Pagination';

import { NewTransactionsImportDialog } from './NewTransactionsImportDialog';

const NB_IMPORTS_DISPLAYED = 20;

const schema = z.object({
  limit: integer.default(NB_IMPORTS_DISPLAYED),
  offset: integer.default(0),
});

const transactionsImportsQuery = gql`
  query HostTransactionImports($accountSlug: String!, $limit: Int, $offset: Int) {
    host(slug: $accountSlug) {
      id
      transactionsImports(limit: $limit, offset: $offset) {
        totalCount
        limit
        offset
        nodes {
          id
          ...TransactionImportListFields
        }
      }
    }
  }
  ${TransactionImportListFieldsFragment}
`;

export const TransactionsImportsTable = ({ accountSlug }) => {
  const intl = useIntl();
  const [hasNewImportDialog, setHasNewImportDialog] = React.useState(false);
  const router = useRouter();
  const queryFilter = useQueryFilter({ schema, filters: {} });
  const { data, loading, refetch, error } = useQuery(transactionsImportsQuery, {
    context: API_V2_CONTEXT,
    variables: { accountSlug, ...queryFilter.variables },
  });

  return (
    <div>
      <DashboardHeader
        title="Transactions"
        titleRoute={`/dashboard/${accountSlug}/host-transactions`}
        subpathTitle="Imports"
        className="mb-5"
        actions={
          <Button size="sm" variant="outline" onClick={() => setHasNewImportDialog(true)}>
            <FormattedMessage defaultMessage="New import" id="tMqgaI" />
          </Button>
        }
      />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : (
        <div>
          <DataTable<TransactionsImport, unknown>
            loading={loading}
            data={data?.host?.transactionsImports?.nodes}
            onClickRow={({ id }) => router.push(`/dashboard/${accountSlug}/host-transactions/import/${id}?step=last`)}
            columns={[
              {
                header: intl.formatMessage({ defaultMessage: 'Import Date', id: 'T1E9co' }),
                accessorKey: 'createdAt',
                cell: ({ cell }) => <DateTime value={cell.getValue() as Date} />,
              },
              {
                header: intl.formatMessage({ defaultMessage: 'Source', id: 'AddFundsModal.source' }),
                accessorKey: 'source',
              },
              {
                header: intl.formatMessage({ defaultMessage: 'Name', id: 'Fields.name' }),
                accessorKey: 'name',
              },
              {
                id: 'stats',
                header: intl.formatMessage({ defaultMessage: 'Processed', id: 'TransactionsImport.processed' }),
                accessorKey: 'stats',
                cell: ({ cell }) => {
                  const stats = cell.getValue() as TransactionsImport['stats'];
                  if (!stats.total) {
                    return (
                      <Badge type="neutral">
                        <FormattedMessage defaultMessage="Not started" id="d5xXmT" />
                      </Badge>
                    );
                  }

                  const percent = Math.floor((stats.processed / stats.total) * 100);
                  return <Badge type={percent === 100 ? 'success' : 'warning'}>{percent}%</Badge>;
                },
              },
              {
                id: 'summary',
                header: intl.formatMessage({ defaultMessage: 'Summary', id: 'Summary' }),
                accessorKey: 'stats',
                cell: ({ cell }) => {
                  const stats = cell.getValue() as TransactionsImport['stats'];
                  const parts = [
                    stats.ignored &&
                      intl.formatMessage(
                        { defaultMessage: 'Ignored {count} transactions', id: 'eGcduM' },
                        { count: stats.ignored },
                      ),
                    (stats.expenses || stats.orders) &&
                      intl.formatMessage(
                        {
                          defaultMessage:
                            'Imported {expensesCount, plural, =0 {} one {# expense} other {# expenses}}{both, plural, =0 {} other { and }}{ordersCount, plural, =0 {} one {# contribution} other {# contributions}}',
                          id: 'ImportTransactionsCount',
                        },
                        {
                          expensesCount: stats.expenses,
                          ordersCount: stats.orders,
                          both: stats.expenses && stats.orders,
                        },
                      ),
                  ];

                  return <span className="text-neutral-600">{capitalize(parts.filter(Boolean).join(', '))}</span>;
                },
              },
            ]}
          />
          <Pagination queryFilter={queryFilter} total={data?.host?.transactionsImports?.totalCount} />
        </div>
      )}

      <NewTransactionsImportDialog
        accountSlug={accountSlug}
        onOpenChange={setHasNewImportDialog}
        open={hasNewImportDialog}
        onSuccess={refetch}
      />
    </div>
  );
};

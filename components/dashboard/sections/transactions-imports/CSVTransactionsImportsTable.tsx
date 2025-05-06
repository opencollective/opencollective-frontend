import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { FileUp } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { integer } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { TransactionsImport } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { i18nTransactionsImportType } from '../../../../lib/i18n/transactions-import';
import { capitalize } from '../../../../lib/utils';
import { TransactionImportListFieldsFragment } from './lib/graphql';
import { getCSVTransactionsImportRoute } from '@/lib/url-helpers';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import DashboardHeader from '../../DashboardHeader';
import { Pagination } from '../../filters/Pagination';

import { ImportProgressBadge } from './ImportProgressBadge';
import { NewCSVTransactionsImportDialog } from './NewCSVTransactionsImportDialog';

const NB_IMPORTS_DISPLAYED = 20;

const schema = z.object({
  limit: integer.default(NB_IMPORTS_DISPLAYED),
  offset: integer.default(0),
});

export const ledgerCSVImportsQuery = gql`
  query LedgerCSVImportsQuery($accountSlug: String!, $limit: Int, $offset: Int) {
    host(slug: $accountSlug) {
      id
      transactionsImports(limit: $limit, offset: $offset, type: [CSV, MANUAL]) {
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

export const CSVTransactionsImportsTable = ({ accountSlug }) => {
  const intl = useIntl();
  const [hasNewImportDialog, setHasNewImportDialog] = React.useState(false);
  const router = useRouter();
  const queryFilter = useQueryFilter({ schema, filters: {} });
  const { data, loading, refetch, error } = useQuery(ledgerCSVImportsQuery, {
    context: API_V2_CONTEXT,
    variables: { accountSlug, ...queryFilter.variables },
  });

  return (
    <div>
      <DashboardHeader
        title="CSV Imports"
        titleRoute={`/dashboard/${accountSlug}/ledger-csv-imports`}
        className="mb-5"
        actions={
          <React.Fragment>
            <Button size="sm" variant="outline" onClick={() => setHasNewImportDialog(true)}>
              <FileUp size={16} />
              <FormattedMessage defaultMessage="Import CSV" id="2uzHxT" />
            </Button>
          </React.Fragment>
        }
      />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : (
        <div>
          <DataTable<TransactionsImport, unknown>
            loading={loading}
            data={data?.host?.transactionsImports?.nodes}
            emptyMessage={() => <FormattedMessage defaultMessage="No CSV imported yet" id="5Tw/Vx" />}
            onClickRow={({ id }) => router.push(getCSVTransactionsImportRoute(accountSlug, id))}
            columns={[
              {
                header: intl.formatMessage({ defaultMessage: 'Source', id: 'AddFundsModal.source' }),
                accessorKey: 'source',
              },
              {
                header: intl.formatMessage({ defaultMessage: 'Name', id: 'Fields.name' }),
                accessorKey: 'name',
              },
              {
                header: intl.formatMessage({ defaultMessage: 'Type', id: 'Fields.type' }),
                accessorKey: 'type',
                cell: ({ cell }) => {
                  const type = cell.getValue() as TransactionsImport['type'];
                  return (
                    <Badge className="whitespace-nowrap" type="neutral">
                      {i18nTransactionsImportType(intl, type)}
                    </Badge>
                  );
                },
              },
              {
                id: 'stats',
                header: intl.formatMessage({ defaultMessage: 'Processed', id: 'TransactionsImport.processed' }),
                accessorKey: 'stats',
                cell: ({ cell }) => {
                  const stats = cell.getValue() as TransactionsImport['stats'];
                  return <ImportProgressBadge progress={!stats.total ? null : stats.processed / stats.total} />;
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

      <NewCSVTransactionsImportDialog
        accountSlug={accountSlug}
        onOpenChange={setHasNewImportDialog}
        open={hasNewImportDialog}
        onSuccess={refetch}
      />
    </div>
  );
};

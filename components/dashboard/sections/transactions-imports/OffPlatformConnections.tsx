import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { ArrowRightLeftIcon, EllipsisVertical, Plus, Settings } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { integer } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { TransactionsImport } from '../../../../lib/graphql/types/v2/schema';
import { usePlaidConnectDialog } from '../../../../lib/hooks/usePlaidConnectDialog';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { TransactionImportListFieldsFragment } from './lib/graphql';
import { getOffPlatformTransactionsRoute } from '@/lib/url-helpers';

import { getI18nLink } from '@/components/I18nFormatters';
import Link from '@/components/Link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';
import DashboardHeader from '../../DashboardHeader';
import { Pagination } from '../../filters/Pagination';

import { TransactionImportLastSyncAtBadge } from './TransactionImportLastSyncAtBadge';
import TransactionsImportSettingsModal from './TransactionsImportSettingsModal';

const NB_IMPORTS_DISPLAYED = 20;

const schema = z.object({
  limit: integer.default(NB_IMPORTS_DISPLAYED),
  offset: integer.default(0),
});

export const offPlatformConnectionsQuery = gql`
  query OffPlatformConnections($accountSlug: String!, $limit: Int, $offset: Int) {
    host(slug: $accountSlug) {
      id
      transactionsImports(limit: $limit, offset: $offset, type: [PLAID]) {
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

export const OffPlatformConnections = ({ accountSlug }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const router = useRouter();
  const queryFilter = useQueryFilter({ schema, filters: {} });
  const [importsWithSyncRequest, setImportsWithSyncRequest] = React.useState(new Set());
  const [selectedImport, setSelectedImport] = React.useState(null);
  const { data, loading, refetch, error } = useQuery(offPlatformConnectionsQuery, {
    context: API_V2_CONTEXT,
    variables: { accountSlug, ...queryFilter.variables },
    pollInterval: importsWithSyncRequest.size ? 5_000 : 30_000,
  });
  const onPlaidConnectSuccess = React.useCallback(
    async ({ transactionsImport }) => {
      refetch();
      toast({
        variant: 'success',
        title: intl.formatMessage({ defaultMessage: 'Bank account connected', id: 'fGNAg9' }),
        message: intl.formatMessage({
          defaultMessage: 'It might take a few minutes to import your transactions.',
          id: 'YZGI7N',
        }),
      });

      router.push(getOffPlatformTransactionsRoute(accountSlug, transactionsImport.id));
    },
    [intl, toast, accountSlug, refetch, router],
  );
  const plaidConnectDialog = usePlaidConnectDialog({ host: data?.host, onConnectSuccess: onPlaidConnectSuccess });

  return (
    <div>
      <DashboardHeader
        title="Off-Platform Connections"
        className="mb-6"
        description={
          <FormattedMessage
            defaultMessage="Link your bank accounts to reconcile <Link>off-platform transactions</Link>."
            id="5aZEOo"
            values={{
              Link: getI18nLink({
                as: Link,
                href: `/dashboard/${accountSlug}/off-platform-transactions`,
                color: 'inherit',
                textDecoration: 'underline',
              }),
            }}
          />
        }
        actions={
          <React.Fragment>
            <Button
              size="sm"
              variant="outline"
              onClick={() => plaidConnectDialog.show()}
              disabled={plaidConnectDialog.status !== 'idle'}
              loading={plaidConnectDialog.status === 'loading'}
            >
              <Plus size={16} />
              <FormattedMessage defaultMessage="New Connection" id="NRwiLl" />
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
                header: intl.formatMessage({ defaultMessage: 'Last sync', id: 'transactions.import.lastSync' }),
                accessorKey: 'lastSyncAt',
                cell: ({ row }) => {
                  const transactionsImport = row.original;
                  return <TransactionImportLastSyncAtBadge transactionsImport={transactionsImport} />;
                },
              },
              {
                header: intl.formatMessage({ defaultMessage: 'Status', id: 'transactions.import.status' }),
                accessorKey: 'status',
                cell: () => {
                  return <Badge type="info">Active</Badge>;
                },
              },
              {
                header: intl.formatMessage({ defaultMessage: 'Actions', id: 'wL7VAE' }),
                cell: ({ row }) => {
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-xs" variant="ghost">
                          <EllipsisVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="min-w-[240px]" align="end">
                        <DropdownMenuItem onClick={() => setSelectedImport(row.original)}>
                          <Settings size={16} />
                          <FormattedMessage defaultMessage="Settings" id="D3idYv" />
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/${accountSlug}/off-platform-transactions?importIds=${row.original.id}`}
                          >
                            <ArrowRightLeftIcon size={16} />
                            <FormattedMessage defaultMessage="View off-platform transactions" id="iqPSC0" />
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                },
              },
            ]}
          />
          <Pagination queryFilter={queryFilter} total={data?.host?.transactionsImports?.totalCount} />
        </div>
      )}
      {selectedImport && (
        <TransactionsImportSettingsModal
          host={data?.host}
          transactionsImport={selectedImport}
          onOpenChange={() => setSelectedImport(null)}
          plaidStatus={plaidConnectDialog.status}
          showPlaidDialog={plaidConnectDialog.show}
          isOpen={true}
          hasRequestedSync={importsWithSyncRequest.has(selectedImport.id)}
          setHasRequestedSync={hasRequestedSync => {
            setImportsWithSyncRequest(prev => {
              const newSet = new Set(prev);
              if (hasRequestedSync) {
                newSet.add(selectedImport.id);
              } else {
                newSet.delete(selectedImport.id);
              }

              return newSet;
            });
          }}
        />
      )}
    </div>
  );
};

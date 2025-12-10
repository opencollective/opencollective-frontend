import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { ArrowRightLeftIcon, EllipsisVertical, Plus, Settings } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { integer } from '../../../../lib/filters/schemas';
import type { TransactionsImport } from '../../../../lib/graphql/types/v2/schema';
import { usePlaidConnectDialog } from '../../../../lib/hooks/usePlaidConnectDialog';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { TransactionImportListFieldsFragment } from './lib/graphql';
import { FEATURES, requiresUpgrade } from '@/lib/allowed-features';
import { getOffPlatformTransactionsRoute } from '@/lib/url-helpers';

import { getI18nLink } from '@/components/I18nFormatters';
import Link from '@/components/Link';
import { UpgradePlanCTA } from '@/components/platform-subscriptions/UpgradePlanCTA';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { Pagination } from '../../filters/Pagination';

import { NewOffPlatformTransactionsConnection } from './NewOffPlatformTransactionsConnection';
import { TransactionImportLastSyncAtBadge } from './TransactionImportLastSyncAtBadge';
import TransactionsImportSettingsModal from './TransactionsImportSettingsModal';

const NB_IMPORTS_DISPLAYED = 20;

const schema = z.object({
  limit: integer.default(NB_IMPORTS_DISPLAYED),
  offset: integer.default(0),
});

const offPlatformConnectionsQuery = gql`
  query OffPlatformConnections($accountSlug: String!, $limit: Int, $offset: Int) {
    host(slug: $accountSlug) {
      id
      slug
      location {
        country
      }
      transactionsImports(limit: $limit, offset: $offset, type: [PLAID, GOCARDLESS]) {
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
  const { account } = React.useContext(DashboardContext);
  const isUpgradeRequired = requiresUpgrade(account, FEATURES.OFF_PLATFORM_TRANSACTIONS);
  const queryFilter = useQueryFilter({ schema, filters: {} });
  const [importsWithSyncRequest, setImportsWithSyncRequest] = React.useState(new Set());
  const [selectedImport, setSelectedImport] = React.useState(null);
  const [showNewConnectionDialog, setShowNewConnectionDialog] = React.useState(false);
  const { data, loading, refetch, error } = useQuery(offPlatformConnectionsQuery, {
    variables: { accountSlug, ...queryFilter.variables },
    pollInterval: importsWithSyncRequest.size ? 5_000 : 0,
    skip: isUpgradeRequired,
  });
  const onPlaidConnectSuccess = React.useCallback(
    async ({ transactionsImport }) => {
      refetch();
      toast({
        variant: 'success',
        title: intl.formatMessage({ defaultMessage: 'Connection succeeded', id: 'qQo6HF' }),
        message: intl.formatMessage({
          defaultMessage: 'It might take a few minutes to import your transactions.',
          id: 'YZGI7N',
        }),
      });

      router.push(getOffPlatformTransactionsRoute(accountSlug, transactionsImport.id));
    },
    [intl, toast, accountSlug, refetch, router],
  );
  const onPlaidUpdateSuccess = React.useCallback(
    ({ transactionsImport }) => {
      toast({
        variant: 'success',
        title: intl.formatMessage(
          { defaultMessage: 'Connection "{name}" updated', id: 'QYlfKp' },
          { name: transactionsImport.source },
        ),
      });
    },
    [intl, toast],
  );
  const onPlaidDialogOpen = React.useCallback(() => {
    setSelectedImport(null);
    setShowNewConnectionDialog(false);
  }, []);

  const plaidConnectDialog = usePlaidConnectDialog({
    host: data?.host,
    onConnectSuccess: onPlaidConnectSuccess,
    onUpdateSuccess: onPlaidUpdateSuccess,
    onOpen: onPlaidDialogOpen,
  });

  const handleNewConnection = React.useCallback(() => {
    setShowNewConnectionDialog(true);
  }, []);

  const handlePlaidConnect = React.useCallback(() => {
    plaidConnectDialog.show();
  }, [plaidConnectDialog]);

  return (
    <div>
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Connected Bank Accounts" id="qPhmMo" />}
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
              onClick={handleNewConnection}
              disabled={!['idle', 'success'].includes(plaidConnectDialog.status) || isUpgradeRequired}
              loading={plaidConnectDialog.status === 'loading'}
            >
              <Plus size={16} />
              <FormattedMessage defaultMessage="New Connection" id="NRwiLl" />
            </Button>
          </React.Fragment>
        }
      />
      {isUpgradeRequired ? (
        <UpgradePlanCTA featureKey={FEATURES.OFF_PLATFORM_TRANSACTIONS} />
      ) : error ? (
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
                cell: ({ row }) => {
                  const transactionsImport = row.original;
                  const isArchived = !transactionsImport.connectedAccount;
                  return (
                    <Badge type={isArchived ? 'neutral' : 'info'}>
                      {!isArchived ? (
                        <FormattedMessage defaultMessage="Active" id="Subscriptions.Active" />
                      ) : (
                        <FormattedMessage defaultMessage="Archived" id="0HT+Ib" />
                      )}
                    </Badge>
                  );
                },
              },
              {
                header: intl.formatMessage({
                  defaultMessage: 'Actions',
                  id: 'CollectivePage.NavBar.ActionMenu.Actions',
                }),
                cell: ({ row }) => {
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-xs" variant="ghost">
                          <EllipsisVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="min-w-[180px]" align="end">
                        <DropdownMenuItem onClick={() => setSelectedImport(row.original)}>
                          <Settings size={16} />
                          <FormattedMessage defaultMessage="Settings" id="Settings" />
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/${accountSlug}/off-platform-transactions?importIds=${row.original.id}`}
                          >
                            <ArrowRightLeftIcon size={16} />
                            <FormattedMessage defaultMessage="View transactions" id="DfQJQ6" />
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
          hostId={data.host.id}
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
          onDelete={() => {
            setSelectedImport(null);
            toast({
              variant: 'success',
              title: intl.formatMessage({ defaultMessage: 'Connection deleted', id: 'BOy+bE' }),
            });
          }}
          onArchived={() => {
            setSelectedImport(null);
            toast({
              variant: 'success',
              title: intl.formatMessage({ defaultMessage: 'Connection archived', id: 'jZM4f3' }),
            });
          }}
        />
      )}
      {showNewConnectionDialog && (
        <NewOffPlatformTransactionsConnection
          isOpen
          onOpenChange={setShowNewConnectionDialog}
          onPlaidConnect={handlePlaidConnect}
          hostCountry={data.host.location?.country}
          hostId={data.host.id}
        />
      )}
    </div>
  );
};

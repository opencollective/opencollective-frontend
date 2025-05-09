import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { Account, ConnectedAccount } from '@/lib/graphql/types/v2/schema';
import { getDashboardRoute } from '@/lib/url-helpers';

import Link from '@/components/Link';
import { Badge } from '@/components/ui/Badge';
import { AsyncCallButton } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/Table';

const DescriptionLink = ({ account }: { account: Pick<Account, 'name' | 'slug'> }) => (
  <Link className="text-primary hover:underline" href={getDashboardRoute(account, 'sending-money')}>
    {account.name}
  </Link>
);

type ConnectedAccountV1V2 = Partial<ConnectedAccount> & {
  username?: string;
  createdByUser?: {
    collective: Pick<Account, 'name' | 'slug'>;
  };
};

type ConnectedAccountsTableProps = {
  connectedAccounts: Partial<ConnectedAccountV1V2>[];
  disconnect?: (connectedAccount: Partial<ConnectedAccountV1V2>) => Promise<void>;
  reconnect?: (connectedAccount: Partial<ConnectedAccountV1V2>) => Promise<void>;
};

export const ConnectedAccountsTable = ({ connectedAccounts, disconnect, reconnect }: ConnectedAccountsTableProps) => {
  return (
    <Table className="w-full">
      <TableBody>
        {connectedAccounts.map(connectedAccount => (
          <TableRow key={connectedAccount.id} className="text-sm text-gray-700" highlightOnHover={false}>
            <TableCell className="w-fit min-w-0">
              <Badge size="sm">
                {connectedAccount.hash?.slice(0, 7) || connectedAccount.username || `#${connectedAccount.legacyId}`}
              </Badge>
            </TableCell>
            <TableCell className="w-full">
              <p>
                <FormattedMessage
                  id="EditWiseAccounts.connectedby"
                  defaultMessage="Connected{createdByName, select, undefined {} other { by {createdByName}}} on {updatedAt, date, short}"
                  values={{
                    updatedAt: new Date(connectedAccount.createdAt),
                    createdByName: (connectedAccount.createdByAccount || connectedAccount.createdByUser?.collective)
                      ?.name,
                  }}
                />
              </p>
              {connectedAccount.settings?.mirroredCollective && (
                <p className="text-xs text-gray-500">
                  <FormattedMessage
                    id="EditWiseAccounts.mirroredAccount"
                    defaultMessage="This account is mirrored from {name}."
                    values={{
                      name: <DescriptionLink account={connectedAccount.settings?.mirroredCollective} />,
                    }}
                  />
                </p>
              )}
              {connectedAccount.accountsMirrored?.length > 0 && (
                <p className="text-xs text-gray-500">
                  <FormattedMessage
                    id="EditWiseAccounts.hasAccountsMirrored"
                    defaultMessage="This token is also being used by {names}."
                    values={{
                      names: (
                        <span className="inline-flex gap-1">
                          {connectedAccount.accountsMirrored.map(account => (
                            <DescriptionLink key={account.slug} account={account} />
                          ))}
                        </span>
                      ),
                    }}
                  />
                </p>
              )}
            </TableCell>
            <TableCell className="flex w-fit min-w-0 items-center gap-1">
              {reconnect && (
                <AsyncCallButton
                  size="xs"
                  className="w-fit"
                  variant="outline"
                  onClick={() => reconnect(connectedAccount)}
                >
                  <FormattedMessage id="collective.connectedAccounts.reconnect.button" defaultMessage="Reconnect" />
                </AsyncCallButton>
              )}
              {disconnect && (
                <AsyncCallButton
                  size="xs"
                  className="w-fit"
                  variant="outline"
                  onClick={() => disconnect(connectedAccount)}
                >
                  <FormattedMessage id="collective.connectedAccounts.disconnect.button" defaultMessage="Disconnect" />
                </AsyncCallButton>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

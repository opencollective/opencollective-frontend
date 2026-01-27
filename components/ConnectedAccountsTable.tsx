import React from 'react';
import { startCase } from 'lodash';
import { FormattedMessage } from 'react-intl';

import type { Account, ConnectedAccount } from '@/lib/graphql/types/v2/schema';
import { ConnectedAccountService } from '@/lib/graphql/types/v2/schema';
import { getDashboardRoute } from '@/lib/url-helpers';

import Link from '@/components/Link';
import { useModal } from '@/components/ModalContext';
import { Badge } from '@/components/ui/Badge';
import { AsyncCallButton } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/Table';

import I18nFormatters from './I18nFormatters';

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
  const { showConfirmationModal } = useModal();

  const handleDisconnect = React.useCallback(
    (connectedAccount: Partial<ConnectedAccountV1V2>) => {
      if (!disconnect) {
        return;
      }

      showConfirmationModal({
        variant: 'destructive',
        type: 'remove',
        title: (
          <FormattedMessage
            defaultMessage="Disconnect {serviceName}"
            id="ktcy9f"
            values={{ serviceName: startCase(connectedAccount.service) }}
          />
        ),
        description:
          connectedAccount.service === ConnectedAccountService.stripe ? (
            <FormattedMessage
              defaultMessage="If your account has recurring contributions, disconnecting will cause them to fail and contributors will need to update their payment methods. Linking a new Stripe account will <strong>not</strong> restore these contributions, as they are permanently linked to this account."
              id="Oys5cL"
              values={I18nFormatters}
            />
          ) : (
            <FormattedMessage defaultMessage="Are you sure you want to disconnect this account?" id="JA425F" />
          ),
        onConfirm: () => disconnect(connectedAccount),
        confirmLabel: (
          <FormattedMessage id="collective.connectedAccounts.disconnect.button" defaultMessage="Disconnect" />
        ),
      });
    },
    [disconnect, showConfirmationModal],
  );

  const handleReconnect = React.useCallback(
    (connectedAccount: Partial<ConnectedAccountV1V2>) => {
      if (!reconnect) {
        return;
      }

      const isStripe = connectedAccount.service === ConnectedAccountService.stripe;

      if (isStripe) {
        showConfirmationModal({
          variant: 'destructive',
          type: 'confirm',
          title: (
            <FormattedMessage defaultMessage="Reconnect {serviceName}" id="FsJ+PB" values={{ serviceName: 'Stripe' }} />
          ),
          description: (
            <FormattedMessage
              defaultMessage="If you have active recurring contributions, you must reconnect the same Stripe account. Connecting a different Stripe account will cause existing recurring contributions to fail, forcing contributors to update their payment methods."
              id="lgRyBX"
            />
          ),
          onConfirm: () => reconnect(connectedAccount),
          confirmLabel: (
            <FormattedMessage id="collective.connectedAccounts.reconnect.button" defaultMessage="Reconnect" />
          ),
        });
      } else {
        reconnect(connectedAccount);
      }
    },
    [reconnect, showConfirmationModal],
  );

  return (
    <Table className="w-full">
      <TableBody>
        {connectedAccounts.map(connectedAccount => (
          <TableRow key={connectedAccount.id} className="bg-white text-sm text-gray-700" highlightOnHover={false}>
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
                  onClick={() => handleReconnect(connectedAccount)}
                >
                  <FormattedMessage id="collective.connectedAccounts.reconnect.button" defaultMessage="Reconnect" />
                </AsyncCallButton>
              )}
              {disconnect && (
                <AsyncCallButton
                  size="xs"
                  className="w-fit"
                  variant="outline"
                  onClick={() => handleDisconnect(connectedAccount)}
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

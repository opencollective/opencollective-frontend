import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { connectAccount } from '@/lib/api';
import { i18nGraphqlException } from '@/lib/errors';
import { API_V1_CONTEXT } from '@/lib/graphql/helpers';
import type { Account, ConnectedAccount, EditTransferWiseAccountQuery } from '@/lib/graphql/types/v2/graphql';
import { editCollectiveSettingsMutation } from '@/lib/graphql/v1/mutations';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import { ConnectedAccountsTable } from '../ConnectedAccountsTable';
import MessageBox from '../MessageBox';
import { useModal } from '../ModalContext';
import StyledCheckbox from '../StyledCheckbox';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { useToast } from '../ui/useToast';

const editTransferWiseAccountQuery = gql`
  query EditTransferWiseAccount($slug: String!) {
    account(slug: $slug) {
      id
      connectedAccounts(service: transferwise) {
        id
        legacyId
        service
        createdAt
        settings
        hash
        createdByAccount {
          id
          legacyId
          name
          slug
        }
        accountsMirrored {
          id
          slug
          name
        }
      }
      settings
    }
  }
`;

const deleteTransferWiseAccountMutation = gql`
  mutation DeleteTransferWiseAccount($id: String!) {
    deleteConnectedAccount(connectedAccount: { id: $id }) {
      id
      service
    }
  }
`;

const EditTransferWiseAccount = ({ collective }: { collective: Account }) => {
  const router = useRouter();
  const intl = useIntl();
  const { showConfirmationModal } = useModal();
  const { toast } = useToast();
  const { LoggedInUser } = useLoggedInUser();
  const { data, loading, refetch } = useQuery<EditTransferWiseAccountQuery>(editTransferWiseAccountQuery, {
    variables: { slug: collective.slug },
  });
  const [deleteTransferWiseAccount, { loading: deleting }] = useMutation(deleteTransferWiseAccountMutation);
  const [setSettings, { loading: mutating }] = useMutation(editCollectiveSettingsMutation, { context: API_V1_CONTEXT });
  const connectedAccounts = data?.account?.connectedAccounts;
  const userIsConnected = connectedAccounts?.some(
    account => account.createdByAccount?.legacyId === LoggedInUser?.CollectiveId,
  );

  const handleConnect = async () => {
    const json = await connectAccount(collective.id, 'transferwise');
    window.location.href = json.redirectUrl;
  };
  const handleDisconnect = async (connectedAccount: Partial<ConnectedAccount>) => {
    const action = async () => {
      await deleteTransferWiseAccount({
        variables: { id: connectedAccount.id },
      });
      await refetch();
    };
    if (connectedAccount.accountsMirrored?.length > 0) {
      showConfirmationModal({
        title: (
          <FormattedMessage
            id="EditWiseAccounts.disconnectMirroredAccount.title"
            defaultMessage="Are you sure you want to disconnect this token?"
          />
        ),
        description: (
          <FormattedMessage
            id="EditWiseAccounts.disconnectMirroredAccount.description"
            defaultMessage="By disconnecting this token, you're also disconnecting {names}."
            values={{
              names: connectedAccount.accountsMirrored.map(account => account.name).join(', '),
            }}
          />
        ),
        onConfirm: async () => {
          try {
            await action();
            toast({
              variant: 'success',
              message: (
                <FormattedMessage
                  defaultMessage="All accounts disconnected from Wise"
                  id="EditWiseAccounts.disconnectAll.success.toast"
                />
              ),
            });
          } catch (e) {
            toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
          }
        },
        variant: 'destructive',
        confirmLabel: (
          <FormattedMessage defaultMessage="Disconnect from Wise" id="EditWiseAccounts.disconnectAll.action.label" />
        ),
      });
    } else {
      await action();
    }
  };
  const handleDisconnectAll = async () => {
    showConfirmationModal({
      title: (
        <FormattedMessage
          id="EditWiseAccounts.disconnectAll.title"
          defaultMessage="Are you sure you want to disconnect {name} from Wise?"
          values={{ name: collective.name }}
        />
      ),
      onConfirm: async () => {
        try {
          await Promise.all(
            connectedAccounts.map(async account => {
              await deleteTransferWiseAccount({
                variables: { id: account.id },
              });
            }),
          );
          toast({
            variant: 'success',
            message: (
              <FormattedMessage
                defaultMessage="All accounts disconnected from Wise"
                id="EditWiseAccounts.disconnectAll.success.toast"
              />
            ),
          });
          await refetch();
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      },
      variant: 'destructive',
      confirmLabel: (
        <FormattedMessage defaultMessage="Disconnect from Wise" id="EditWiseAccounts.disconnectAll.action.label" />
      ),
    });
  };

  const handleUpdateSetting = async generateReference => {
    await setSettings({
      variables: {
        id: collective.id,
        settings: {
          ...collective.settings,
          transferwise: {
            ...collective.settings.transferwise,
            generateReference,
          },
        },
      },
    });
  };

  const error = router.query?.error;
  if (loading) {
    return <Skeleton className="mb-3 h-10 w-full" />;
  }
  if (connectedAccounts.length === 0) {
    return (
      <React.Fragment>
        <div className="mb-3 text-sm text-gray-700">
          <FormattedMessage
            id="collective.create.connectedAccounts.transferwise.description"
            defaultMessage="Connect a Wise account to pay expenses with one click."
          />
        </div>
        {error && (
          <MessageBox withIcon type="error" mb={3}>
            {error}
          </MessageBox>
        )}

        <Button size="sm" className="w-fit" type="submit" onClick={handleConnect}>
          <FormattedMessage defaultMessage="Connect {service}" id="C9HmCs" values={{ service: 'Wise' }} />
        </Button>
      </React.Fragment>
    );
  } else {
    return (
      <div className="flex flex-col gap-4">
        <ConnectedAccountsTable
          connectedAccounts={connectedAccounts as Partial<ConnectedAccount>[]}
          disconnect={handleDisconnect}
        />
        {(!userIsConnected || connectedAccounts.length > 1) && (
          <div className="flex w-full flex-row gap-2">
            {!userIsConnected && (
              <Button size="sm" className="w-fit" variant="outline" onClick={handleConnect}>
                <FormattedMessage defaultMessage="Connect my Wise profile" id="EditWiseAccounts.connectMyUser.label" />
              </Button>
            )}
            {connectedAccounts.length > 1 && (
              <Button
                size="sm"
                className="w-fit"
                variant="outlineDestructive"
                onClick={handleDisconnectAll}
                disabled={deleting}
              >
                <FormattedMessage id="EditWiseAccounts.disconnectAll.button" defaultMessage="Disconnect all users" />
              </Button>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-bold">
            <FormattedMessage id="header.options" defaultMessage="Options" />
          </h1>
          <StyledCheckbox
            name="generateReference"
            label={
              <FormattedMessage
                id="collective.connectedAccounts.wise.generateReference"
                defaultMessage="Automatically generate the transfer reference based on Collective name and Expense ID."
              />
            }
            checked={collective.settings?.transferwise?.generateReference !== false}
            onChange={({ checked }) => handleUpdateSetting(checked)}
            loading={mutating}
          />
        </div>
      </div>
    );
  }
};

export default EditTransferWiseAccount;

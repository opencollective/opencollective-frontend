import React from 'react';
import { gql, useApolloClient, useMutation } from '@apollo/client';
import { Form, Formik } from 'formik';
import { omit } from 'lodash';
import { AlertTriangle, ArchiveIcon, Plug } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { TransactionsImport } from '../../../../lib/graphql/types/v2/schema';
import type { PlaidDialogStatus } from '@/lib/hooks/usePlaidConnectDialog';

import DateTime from '@/components/DateTime';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../../ui/AlertDialog';
import { Button } from '../../../ui/Button';
import { Card, CardContent } from '../../../ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { Input } from '../../../ui/Input';
import { Label } from '../../../ui/Label';
import { Separator } from '../../../ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/Tabs';
import { useToast } from '../../../ui/useToast';

import { SyncPlaidAccountButton } from './SyncPlaidAccountButton';
import { TransactionsImportAssignmentsForm } from './TransactionsImportAssignmentsForm';

const deleteTransactionsImportMutation = gql`
  mutation DeleteTransactionsImport($id: NonEmptyString!) {
    deleteTransactionsImport(id: $id)
  }
`;

const editTransactionsImportMutation = gql`
  mutation EditTransactionsImport($id: NonEmptyString!, $source: NonEmptyString, $name: NonEmptyString) {
    editTransactionsImport(id: $id, source: $source, name: $name) {
      id
      source
      name
    }
  }
`;

const deleteConnectedAccountMutation = gql`
  mutation DeleteConnectedAccount($connectedAccount: ConnectedAccountReferenceInput!) {
    deleteConnectedAccount(connectedAccount: $connectedAccount) {
      id
    }
  }
`;

export default function TransactionsImportSettingsModal({
  transactionsImport,
  plaidStatus,
  onOpenChange,
  showPlaidDialog,
  isOpen,
  hasRequestedSync,
  setHasRequestedSync,
}: {
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean;
  showPlaidDialog: () => void;
  plaidStatus: PlaidDialogStatus;
  hasRequestedSync: boolean;
  setHasRequestedSync: (hasRequestedSync: boolean) => void;
  transactionsImport: Pick<
    TransactionsImport,
    'id' | 'source' | 'name' | 'type' | 'isSyncing' | 'lastSyncAt' | 'plaidAccounts'
  > &
    React.ComponentProps<typeof TransactionsImportAssignmentsForm>['transactionsImport'] & {
      connectedAccount?: Pick<TransactionsImport['connectedAccount'], 'id'>;
    };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const intl = useIntl();
  const mutationParams = { context: API_V2_CONTEXT };
  const apolloClient = useApolloClient();
  const [editTransactionsImport] = useMutation(editTransactionsImportMutation, mutationParams);
  const [deleteConnectedAccount, { loading: isDisconnecting }] = useMutation(
    deleteConnectedAccountMutation,
    mutationParams,
  );
  const [deleteTransactionsImport, { loading: isDeleting }] = useMutation(
    deleteTransactionsImportMutation,
    mutationParams,
  );

  const handleDisconnect = async () => {
    try {
      await deleteConnectedAccount({
        variables: { connectedAccount: { id: transactionsImport.connectedAccount.id } },
      });
      apolloClient.cache.modify({
        id: apolloClient.cache.identify(transactionsImport),
        fields: { connectedAccount: () => null },
      });
      onOpenChange(false);
      toast({
        variant: 'success',
        message: intl.formatMessage({ defaultMessage: 'Bank account disconnected.', id: 'BankAccount.Disconnected' }),
      });
    } catch (error) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTransactionsImport({ variables: { id: transactionsImport.id } });
      apolloClient.cache.evict({ id: apolloClient.cache.identify(transactionsImport) });
      router.push(router.asPath.replace(/\/host-transactions\/import\/.*/, '/host-transactions/import'));
    } catch (error) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            <FormattedMessage defaultMessage="Transaction Import Settings" id="38fPNE" />
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-3 grid w-full grid-cols-3">
            <TabsTrigger value="general">
              <FormattedMessage id="settings.general" defaultMessage="General" />
            </TabsTrigger>
            <TabsTrigger value="accounts">
              <FormattedMessage id="FvanT6" defaultMessage="Accounts" />
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <FormattedMessage id="editCollective.menu.advanced" defaultMessage="Advanced" />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="px-1">
            <Formik
              initialValues={transactionsImport}
              onSubmit={async values => {
                try {
                  await editTransactionsImport({ variables: { ...omit(values, ['__typename']) } });
                  onOpenChange(false);
                  toast({
                    variant: 'success',
                    message: intl.formatMessage({ defaultMessage: 'Settings updated.', id: 'Settings.Updated' }),
                  });
                } catch (error) {
                  toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
                }
              }}
            >
              {({ values, setFieldValue, dirty, isSubmitting }) => (
                <Form>
                  <div className="space-y-1">
                    <Label htmlFor="sourceName" className="text-sm font-medium">
                      <FormattedMessage defaultMessage="Source name" id="5NOdsW" />
                    </Label>
                    <Input
                      id="sourceName"
                      value={values.source}
                      onChange={e => setFieldValue('source', e.target.value)}
                      maxLength={255}
                      required
                    />
                  </div>
                  <div className="mt-4 space-y-1">
                    <Label htmlFor="importName" className="text-sm font-medium">
                      <FormattedMessage defaultMessage="Import name" id="Me1N3w" />
                    </Label>
                    <Input
                      id="importName"
                      value={values.name}
                      onChange={e => setFieldValue('name', e.target.value)}
                      maxLength={255}
                      required
                    />
                  </div>
                  <div className="mt-6 flex justify-between space-x-2">
                    <Button
                      disabled={isSubmitting}
                      type="reset"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onOpenChange(false)}
                    >
                      <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
                    </Button>
                    <Button loading={isSubmitting} type="submit" className="flex-1" disabled={!dirty}>
                      <FormattedMessage id="save" defaultMessage="Save" />
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </TabsContent>
          <TabsContent value="accounts" className="px-1">
            <TransactionsImportAssignmentsForm
              transactionsImport={transactionsImport}
              plaidStatus={plaidStatus}
              onOpenChange={onOpenChange}
              showPlaidDialog={showPlaidDialog}
              isDeleting={isDeleting}
            />
          </TabsContent>
          <TabsContent value="advanced">
            {transactionsImport.type === 'PLAID' && transactionsImport.connectedAccount && (
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <h3 className="mb-2 text-sm font-medium">
                    <FormattedMessage defaultMessage="Update connection" id="qFfWnO" />
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    <FormattedMessage
                      defaultMessage="If the synchronization stopped working, you can reconnect the bank account."
                      id="ZMw3dZ"
                    />
                  </p>
                  <Button
                    loading={plaidStatus === 'loading' || plaidStatus === 'active'}
                    disabled={plaidStatus === 'disabled' || isDeleting}
                    onClick={showPlaidDialog}
                    variant="outline"
                    className="w-full"
                  >
                    <Plug size={16} />
                    <FormattedMessage defaultMessage="Reconnect" id="collective.connectedAccounts.reconnect.button" />
                  </Button>
                  <Separator className="my-4" />
                  <h3 className="mb-2 text-sm font-medium">
                    <FormattedMessage defaultMessage="Force synchronization" id="w4ZT18" />
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    <FormattedMessage
                      id="withColon"
                      defaultMessage="{item}:"
                      values={{
                        item: <FormattedMessage defaultMessage="Last sync" id="transactions.import.lastSync" />,
                      }}
                    />{' '}
                    {transactionsImport.lastSyncAt ? (
                      <span className="underline decoration-dotted underline-offset-2">
                        <DateTime value={transactionsImport.lastSyncAt} timeStyle="short" />
                      </span>
                    ) : (
                      <FormattedMessage defaultMessage="Never" id="du1laW" />
                    )}
                    .
                  </p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    <FormattedMessage
                      defaultMessage="The synchronization is automatic and happens up to 4 times per day. You can manually request a sync at any time using the button below."
                      id="fRDMf8"
                    />
                  </p>

                  <SyncPlaidAccountButton
                    hasRequestedSync={hasRequestedSync}
                    setHasRequestedSync={setHasRequestedSync}
                    connectedAccountId={transactionsImport.connectedAccount.id}
                    isSyncing={transactionsImport.isSyncing}
                    size="default"
                    className="w-full"
                  />
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="space-y-6 pt-6">
                {transactionsImport.connectedAccount && (
                  <React.Fragment>
                    <div>
                      <h3 className="mb-2 text-sm font-medium">
                        <FormattedMessage defaultMessage="Archive connection" id="zE6WtX" />
                      </h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        <FormattedMessage
                          defaultMessage="Stops future imports. Existing data will remain intact, but you won't be able to resume the synchronization in the future."
                          id="j15K8y"
                        />
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="w-full"
                            loading={isDisconnecting}
                            disabled={isDeleting}
                          >
                            <ArchiveIcon size={16} />
                            <FormattedMessage defaultMessage="Archive" id="hrgo+E" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              <FormattedMessage defaultMessage="Archive connection" id="zE6WtX" />
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              <FormattedMessage
                                defaultMessage="You won't be able to resume the synchronization in the future."
                                id="FKMNjH"
                              />
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleDisconnect} variant="destructive">
                              <FormattedMessage
                                defaultMessage="Disconnect"
                                id="collective.connectedAccounts.disconnect.button"
                              />
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <Separator />
                  </React.Fragment>
                )}
                <div>
                  <h3 className="mb-2 text-sm font-medium">
                    <FormattedMessage defaultMessage="Delete connection" id="ksAAzc" />
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    <FormattedMessage
                      values={{ hasConnectedAccount: transactionsImport.connectedAccount ? 0 : 1 }}
                      defaultMessage="This will {hasConnectedAccount, select, 0 {disconnect and } other {}}permanently delete the import with its associated data. Items imported in your ledger (expenses and added funds) will be preserved."
                      id="2t040E"
                    />
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full" loading={isDeleting} disabled={isDisconnecting}>
                        <AlertTriangle size={16} />
                        <FormattedMessage defaultMessage="Delete" id="K3r6DQ" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          <FormattedMessage defaultMessage="Delete connection" id="ksAAzc" />
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          <FormattedMessage
                            defaultMessage="This will permanently delete the import and remove all associated data."
                            id="yNLkKo"
                          />
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} variant="destructive">
                          <FormattedMessage defaultMessage="Delete" id="actions.delete" />
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { Form, Formik } from 'formik';
import { uniqBy } from 'lodash';
import { Building, ChartCandlestick, ChartLine, CreditCard, HandCoins, Landmark, Wallet } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { TransactionsImportAssignmentFieldsFragment } from './lib/graphql';
import { DEFAULT_ASSIGNMENT_ACCOUNT_ID } from './lib/types';
import { getAccountReferenceInput } from '@/lib/collective';
import type { GraphQLV1Collective } from '@/lib/custom_typings/GraphQLV1';
import { i18nGraphqlException } from '@/lib/errors';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type { Account, TransactionsImport } from '@/lib/graphql/types/v2/schema';
import type { PlaidDialogStatus } from '@/lib/hooks/usePlaidConnectDialog';

import CollectivePickerAsync from '@/components/CollectivePickerAsync';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/useToast';

const editTransactionsImportAssignmentsMutation = gql`
  mutation EditTransactionsImportAssignments(
    $id: NonEmptyString!
    $assignments: [TransactionsImportAssignmentInput!]!
  ) {
    editTransactionsImport(id: $id, assignments: $assignments) {
      id
      assignments {
        ...TransactionsImportAssignmentFields
      }
    }
  }
  ${TransactionsImportAssignmentFieldsFragment}
`;

const CollectivePickerReactSelectStyles = {
  control: { borderRadius: '12px' },
  menu: { fontSize: '12px' },
};

const getPlaidAccountIcon = (type: string) => {
  switch (type) {
    case 'depository':
      return <Wallet size={16} className="text-blue-500" />;
    case 'credit':
      return <CreditCard size={16} className="text-purple-500" />;
    case 'investment':
      return <ChartLine size={16} className="text-green-500" />;
    case 'loan':
      return <HandCoins size={16} className="text-yellow-500" />;
    case 'brokerage':
      return <ChartCandlestick size={16} className="text-green-500" />;
    default:
      return <Building size={16} className="text-green-500" />;
  }
};

type AssignmentFormValues = Array<{
  importedAccountId: string;
  accounts: Array<Pick<GraphQLV1Collective, 'id'> | Pick<Account, 'id'>>;
}>;

type AccountOption = {
  label: string;
  value: GraphQLV1Collective;
};

const updateValues = (values: AssignmentFormValues, accountId: string, options: readonly AccountOption[] | null) => {
  const assignmentIdx = values.findIndex(assignment => assignment.importedAccountId === accountId);
  const accounts = uniqBy(options?.map(option => option.value) || [], 'id');
  if (assignmentIdx === -1) {
    return [...values, { importedAccountId: accountId, accounts }];
  } else {
    const newArray = [...values];
    newArray[assignmentIdx] = { importedAccountId: accountId, accounts };
    return newArray;
  }
};

export const TransactionsImportAssignmentsForm = ({
  transactionsImport,
  plaidStatus,
  onOpenChange,
  showPlaidDialog,
  isDeleting,
}: {
  transactionsImport: Pick<TransactionsImport, 'id' | 'type' | 'plaidAccounts'> & {
    connectedAccount?: Pick<TransactionsImport['connectedAccount'], 'id'>;
    account: Pick<TransactionsImport['account'], 'legacyId'>;
    assignments: Array<{
      importedAccountId: string;
      accounts: Pick<Account, 'id' | 'slug' | 'type'>[];
    }>;
  };
  plaidStatus: PlaidDialogStatus;
  onOpenChange: (isOpen: boolean) => void;
  showPlaidDialog: ({ accountsSelectionEnabled }: { accountsSelectionEnabled?: boolean }) => void;
  isDeleting: boolean;
}) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [editTransactionsImportAssignments] = useMutation(editTransactionsImportAssignmentsMutation, {
    context: API_V2_CONTEXT,
  });

  return (
    <Formik<AssignmentFormValues>
      initialValues={transactionsImport.assignments}
      onSubmit={async (values, { resetForm }) => {
        try {
          const result = await editTransactionsImportAssignments({
            variables: {
              id: transactionsImport.id,
              assignments: values.map(assignment => ({
                importedAccountId: assignment.importedAccountId,
                accounts: assignment.accounts.map(getAccountReferenceInput),
              })),
            },
          });

          toast({
            variant: 'success',
            message: intl.formatMessage({ defaultMessage: 'Assignments updated', id: 'RdMtaz' }),
          });

          resetForm({ values: result.data?.editTransactionsImport.assignments });
        } catch (error) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
        }
      }}
    >
      {({ dirty, isSubmitting, setValues, values }) => {
        const getAssignmentAccounts = (accountId: string) =>
          values.find(assignment => assignment.importedAccountId === accountId)?.accounts || [];
        return (
          <Form>
            {transactionsImport.type === 'PLAID' ? (
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">
                    <FormattedMessage
                      defaultMessage="Connected Plaid accounts"
                      id="settings.accounts.connectedAccounts"
                    />
                  </p>
                  {transactionsImport.connectedAccount && (
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-xs text-wrap"
                      loading={plaidStatus === 'loading' || plaidStatus === 'active'}
                      disabled={plaidStatus === 'disabled' || isDeleting || isSubmitting}
                      onClick={() => showPlaidDialog({ accountsSelectionEnabled: true })}
                    >
                      <Landmark size={14} />
                      <FormattedMessage defaultMessage="Update selection" id="FyTcpa" />
                    </Button>
                  )}
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="By default, imported transactions will be assigned to the account selected here."
                    id="Neyl6Y"
                  />{' '}
                  <FormattedMessage defaultMessage="You can override this assignment for each account." id="wckrmL" />
                </p>
                {!transactionsImport.plaidAccounts?.length ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    <FormattedMessage
                      defaultMessage="The accounts for this import are not available."
                      id="settings.accounts.noAccounts"
                    />
                  </p>
                ) : (
                  <div className="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto">
                    {transactionsImport.plaidAccounts.map(plaidAccount => (
                      <Card className="overflow-hidden" key={plaidAccount.accountId}>
                        <CardContent className="p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getPlaidAccountIcon(plaidAccount.type)}
                              <span className="text-sm font-medium text-gray-700">{plaidAccount.name}</span>
                            </div>
                            <span className="text-xs font-medium text-gray-500">****{plaidAccount.mask}</span>
                          </div>
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="text-gray-500 capitalize">
                              {plaidAccount.type} - {plaidAccount.subtype}
                            </span>
                          </div>
                          <CollectivePickerAsync
                            inputId={`plaid-account-${plaidAccount.accountId}`}
                            hostCollectiveIds={[transactionsImport.account.legacyId]}
                            isMulti
                            fontSize="12px"
                            collective={getAssignmentAccounts(plaidAccount.accountId)}
                            styles={CollectivePickerReactSelectStyles}
                            placeholder={intl.formatMessage(
                              { defaultMessage: 'Assign {account} transactions to…', id: 'KJ1bsa' },
                              { account: plaidAccount.name },
                            )}
                            disabled={isSubmitting}
                            onChange={value => {
                              setValues(updateValues(values, plaidAccount.accountId, value));
                            }}
                            truncationThreshold={30}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <p className="mb-4 text-sm">
                  <FormattedMessage
                    defaultMessage="By default, imported transactions will be assigned to the account selected here."
                    id="Neyl6Y"
                  />
                </p>
                <CollectivePickerAsync
                  inputId={`transactions-import-default-account`}
                  hostCollectiveIds={[transactionsImport.account.legacyId]}
                  isMulti
                  fontSize="12px"
                  collective={getAssignmentAccounts(DEFAULT_ASSIGNMENT_ACCOUNT_ID)}
                  styles={CollectivePickerReactSelectStyles}
                  placeholder={intl.formatMessage({
                    defaultMessage: 'By default, assign transactions to…',
                    id: 'FGQ00F',
                  })}
                  disabled={isSubmitting}
                  onChange={(options: readonly AccountOption[] | null) => {
                    setValues(updateValues(values, DEFAULT_ASSIGNMENT_ACCOUNT_ID, options));
                  }}
                />
              </div>
            )}
            <div className="mt-8 flex justify-between space-x-2">
              <Button
                type="reset"
                variant="outline"
                className="flex-1"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
              </Button>
              <Button type="submit" className="flex-1" loading={isSubmitting} disabled={!dirty}>
                <FormattedMessage id="save" defaultMessage="Save" />
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

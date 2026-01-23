import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { getAccountReferenceInput } from '@/lib/collective';
import { i18nGraphqlException } from '@/lib/errors';
import type { AccountsDashboardQuery, DashboardAccountsQueryFieldsFragment } from '@/lib/graphql/types/v2/graphql';
import type { Account } from '@/lib/graphql/types/v2/schema';
import { Currency } from '@/lib/graphql/types/v2/schema';
import { fromCollectiveSearchQuery } from '@/lib/graphql/v1/queries';

import CollectivePickerAsync from '@/components/CollectivePickerAsync';

import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { FormField } from '../../../FormField';
import { FormikZod } from '../../../FormikZod';
import type { BaseModalProps } from '../../../ModalContext';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { InputGroup } from '../../../ui/Input';
import { toast } from '../../../ui/useToast';

import { accountsQuery } from './queries';

const transferFundsFormValuesSchema = z.object({
  fromAccount: z.object({ id: z.union([z.string(), z.number()]).optional(), name: z.string().optional() }), // accountReferenceInput
  toAccount: z.object({ id: z.union([z.string(), z.number()]).optional(), name: z.string().optional() }), // accountReferenceInput
  amount: z.object({ valueInCents: z.number().min(1), currency: z.nativeEnum(Currency) }),
});

const internalTransferMutation = gql`
  mutation InternalTransfer($order: OrderCreateInput!) {
    createOrder(order: $order) {
      order {
        id
        fromAccount {
          id
          stats {
            id
            balance {
              valueInCents
            }
          }
        }
      }
    }
  }
`;

interface InternalTransferModalProps extends BaseModalProps {
  defaultFromAccount?: DashboardAccountsQueryFieldsFragment;
  parentAccount: Pick<Account, 'legacyId' | 'id' | 'slug' | 'name'>;
}

export default function InternalTransferModal({
  open,
  setOpen,
  defaultFromAccount,
  onCloseFocusRef,
  parentAccount,
}: InternalTransferModalProps) {
  const intl = useIntl();
  const formikRef = React.useRef<FormikProps<z.infer<typeof transferFundsFormValuesSchema>>>(null);

  const { data, loading } = useQuery(accountsQuery, {
    variables: {
      accountSlug: parentAccount.slug,
      limit: 10,
    },
  });

  const activeAccounts = React.useMemo(
    () =>
      data?.account ? [data?.account, ...(data?.account?.childrenAccounts?.nodes.filter(a => a.isActive) || [])] : [],
    [data?.account],
  );

  // Update currency when activeAccounts load
  React.useEffect(() => {
    if (data?.account?.currency && formikRef.current) {
      formikRef.current.setFieldValue('amount.currency', data.account.currency);
    }
  }, [data?.accout]);

  const [createInternalTransfer, { loading: loadingMutation }] = useMutation(internalTransferMutation);

  const isLoading = loadingMutation || loading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onCloseAutoFocus={e => {
          if (onCloseFocusRef?.current) {
            e.preventDefault();
            onCloseFocusRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="New internal transfer" id="v4unZI" />
          </DialogTitle>
          <DialogDescription>
            <FormattedMessage defaultMessage="Transfer funds between your accounts." id="2JPEip" />
          </DialogDescription>
        </DialogHeader>
        <FormikZod<z.infer<typeof transferFundsFormValuesSchema>>
          schema={transferFundsFormValuesSchema}
          initialValues={{
            fromAccount: defaultFromAccount ?? undefined,
            toAccount: undefined,
            amount: {
              valueInCents: 0,
              currency: activeAccounts[0]?.currency,
            },
          }}
          onSubmit={async values => {
            const order = {
              fromAccount: getAccountReferenceInput(values.fromAccount),
              toAccount: getAccountReferenceInput(values.toAccount),
              amount: { valueInCents: values.amount.valueInCents, currency: values.amount.currency },
              frequency: 'ONETIME',
              isBalanceTransfer: true,
            };
            try {
              await createInternalTransfer({
                variables: {
                  order,
                },
              });
              toast({
                variant: 'success',
                message: intl.formatMessage(
                  {
                    defaultMessage: 'Successfully transferred {amount} from {fromAccount} to {toAccount}',
                    id: 'ROFVEn',
                  },
                  {
                    amount: (
                      <FormattedMoneyAmount
                        amountClassName="font-medium"
                        showCurrencyCode={false}
                        amount={values.amount.valueInCents}
                        currency={values.amount.currency}
                      />
                    ),
                    fromAccount: <span className="font-medium">{values.fromAccount.name}</span>,
                    toAccount: <span className="font-medium">{values.toAccount.name}</span>,
                  },
                ),
              });
              setOpen(false);
            } catch (e) {
              toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
            }
          }}
          innerRef={formikRef}
        >
          {({ setFieldValue, values }) => {
            const fromAccount = values.fromAccount as AccountsDashboardQuery['account'] & {
              stats?: { balanceWithBlockedFunds?: number };
            };
            const availableBalance = fromAccount?.stats?.balance
              ? fromAccount?.stats?.balance
              : fromAccount?.stats?.balanceWithBlockedFunds
                ? {
                    currency: fromAccount.currency,
                    valueInCents: fromAccount.stats.balanceWithBlockedFunds,
                  }
                : null;

            return (
              <Form>
                <div className="space-y-4">
                  <FormField
                    name="fromAccount"
                    label={intl.formatMessage({ defaultMessage: 'From account', id: 'F4xg6X' })}
                  >
                    {({ field, form }) => (
                      <CollectivePickerAsync
                        inputId={field.id}
                        collective={field.value}
                        defaultCollectives={activeAccounts}
                        includeArchived={true}
                        parentCollectiveIds={[parentAccount?.legacyId]}
                        searchQuery={fromCollectiveSearchQuery}
                        onChange={({ value }) => {
                          setFieldValue('fromAccount', value);
                          if (form.values?.toAccount?.id === value?.id) {
                            setFieldValue('toAccount', null);
                          }
                        }}
                      />
                    )}
                  </FormField>

                  <FormField
                    name="toAccount"
                    label={intl.formatMessage({ defaultMessage: 'To account', id: 'gCOFay' })}
                  >
                    {({ field, form }) => (
                      <CollectivePickerAsync
                        inputId={field.id}
                        collective={field.value}
                        defaultCollectives={activeAccounts.filter(
                          a =>
                            (a.legacyId || a.id) !== (form.values.fromAccount?.legacyId || form.values.fromAccount?.id),
                        )}
                        includeArchived={true}
                        parentCollectiveIds={[parentAccount?.legacyId]}
                        onChange={({ value }) => {
                          setFieldValue('toAccount', value);
                        }}
                      />
                    )}
                  </FormField>
                  <FormField
                    name="amount.valueInCents"
                    label={intl.formatMessage({ defaultMessage: 'Amount', id: 'Fields.amount' })}
                    error={
                      values.amount.valueInCents > availableBalance?.valueInCents
                        ? intl.formatMessage({ defaultMessage: 'Not enough balance', id: 'N7eekt' })
                        : undefined
                    }
                  >
                    {({ field }) => {
                      return (
                        <div className="flex items-center gap-2">
                          <InputGroup
                            prepend={values.amount?.currency}
                            value={field.value ? field.value / 100 : ''}
                            type="number"
                            inputMode="numeric"
                            onChange={e =>
                              setFieldValue('amount', {
                                valueInCents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : '',
                                currency: data.account.currency,
                              })
                            }
                            className="flex-1"
                          />
                          {availableBalance && (
                            <Button
                              variant="ghost"
                              onClick={() =>
                                availableBalance && setFieldValue('amount.valueInCents', availableBalance.valueInCents)
                              }
                            >
                              <FormattedMessage defaultMessage="Use all" id="balance.useAll" />
                            </Button>
                          )}
                        </div>
                      );
                    }}
                  </FormField>
                  {availableBalance && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <FormattedMessage
                        defaultMessage="Available balance: {amount}"
                        id="gzXJea"
                        values={{
                          amount: (
                            <FormattedMoneyAmount
                              showCurrencyCode={false}
                              amount={availableBalance.valueInCents}
                              currency={availableBalance.currency}
                            />
                          ),
                        }}
                      />
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <Button onClick={() => setOpen(false)} variant="outline" disabled={loadingMutation}>
                      <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
                    </Button>
                    <Button type="submit" disabled={isLoading} loading={loadingMutation}>
                      <FormattedMessage defaultMessage="Transfer" id="actions.transfer" />
                    </Button>
                  </div>
                </div>
              </Form>
            );
          }}
        </FormikZod>
      </DialogContent>
    </Dialog>
  );
}

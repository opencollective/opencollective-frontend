import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { Form } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { getAccountReferenceInput } from '../../../../lib/collective';
import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { DashboardAccountsQueryFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';
import { Currency } from '../../../../lib/graphql/types/v2/graphql';

import CollectivePicker from '../../../CollectivePicker';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { FormField } from '../../../FormField';
import { FormikZod } from '../../../FormikZod';
import type { BaseModalProps } from '../../../ModalContext';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { InputGroup } from '../../../ui/Input';
import { toast } from '../../../ui/useToast';

const transferFundsFormValuesSchema = z.object({
  fromAccount: z.object({ id: z.string().optional(), name: z.string().optional() }), // accountReferenceInput
  toAccount: z.object({ id: z.string().optional(), name: z.string().optional() }), // / accountReferenceInput
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
  accounts: DashboardAccountsQueryFieldsFragment[];
}

export default function InternalTransferModal({
  open,
  setOpen,
  accounts,
  defaultFromAccount,
  onCloseFocusRef,
}: InternalTransferModalProps) {
  const intl = useIntl();
  const [createInternalTransfer, { loading }] = useMutation(internalTransferMutation, { context: API_V2_CONTEXT });

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
              currency: accounts[0]?.currency || Currency.USD,
            },
          }}
          onSubmit={async values => {
            const paymentMethods = values.fromAccount?.id
              ? accounts.find(a => a.id === values.fromAccount.id)?.paymentMethods
              : null;
            if (!paymentMethods || paymentMethods.length === 0) {
              toast({
                variant: 'error',
                message: (
                  <FormattedMessage
                    defaultMessage="We couldn't find a payment method to make this transaction"
                    id="+H8kCF"
                  />
                ),
              });
              return;
            }

            const order = {
              fromAccount: getAccountReferenceInput(values.fromAccount),
              toAccount: getAccountReferenceInput(values.toAccount),
              amount: { valueInCents: values.amount.valueInCents, currency: values.amount.currency },
              paymentMethod: { id: paymentMethods[0].id },
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
                    defaultMessage: 'Transfered {amount} from {fromAccount} to {toAccount}',
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
        >
          {({ setFieldValue, values }) => {
            const availableBalance = values.fromAccount?.id
              ? accounts.find(a => a.id === values.fromAccount.id)?.stats.balance
              : null;
            return (
              <Form>
                <div className="space-y-4">
                  <FormField
                    name="fromAccount"
                    label={intl.formatMessage({ defaultMessage: 'From account', id: 'F4xg6X' })}
                  >
                    {({ field }) => (
                      <CollectivePicker
                        collective={field.value}
                        collectives={accounts}
                        onChange={({ value }) => {
                          setFieldValue('fromAccount', value);
                        }}
                      />
                    )}
                  </FormField>

                  <FormField
                    name="toAccount"
                    label={intl.formatMessage({ defaultMessage: 'To account', id: 'gCOFay' })}
                  >
                    {({ field }) => (
                      <CollectivePicker
                        collective={field.value}
                        collectives={accounts}
                        onChange={({ value }) => setFieldValue('toAccount', value)}
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
                            prepend={values.amount.currency}
                            value={field.value ? field.value / 100 : ''}
                            type="number"
                            inputMode="numeric"
                            onChange={e =>
                              setFieldValue(
                                'amount.valueInCents',
                                e.target.value ? parseFloat(e.target.value) * 100 : '',
                              )
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
                    <Button onClick={() => setOpen(false)} variant="outline" disabled={loading}>
                      <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
                    </Button>
                    <Button type="submit" loading={loading}>
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

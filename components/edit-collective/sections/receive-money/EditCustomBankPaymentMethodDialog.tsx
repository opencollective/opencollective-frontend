import React from 'react';
import { useMutation } from '@apollo/client';
import { Formik } from 'formik';
import { findLast, get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { BANK_TRANSFER_DEFAULT_INSTRUCTIONS, PayoutMethodType } from '../../../../lib/constants/payout-method';
import { gql } from '../../../../lib/graphql/helpers';

import PayoutBankInformationForm from '../../../expenses/PayoutBankInformationForm';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { Label } from '../../../ui/Label';
import { useToast } from '../../../ui/useToast';
import { formatAccountDetails } from '../../utils';

import { COMMON_TEMPLATE_VARIABLES } from './constants';
import { CustomPayoutMethodInstructionsVariablesHelp } from './CustomPayoutMethodInstructionsVariablesHelp';
import { CustomPayoutMethodTemplateEditor } from './CustomPayoutMethodTemplateEditor';

const createPayoutMethodMutation = gql`
  mutation EditCollectiveBankTransferCreatePayoutMethod(
    $payoutMethod: PayoutMethodInput!
    $account: AccountReferenceInput!
  ) {
    createPayoutMethod(payoutMethod: $payoutMethod, account: $account) {
      data
      id
      name
      type
    }
  }
`;

const editBankTransferMutation = gql`
  mutation EditCollectiveBankTransfer($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const hostQuery = gql`
  query EditCollectiveBankTransferHost($slug: String) {
    host(slug: $slug) {
      id
      slug
      legacyId
      currency
      settings
      connectedAccounts {
        id
        service
      }
      plan {
        id
        hostedCollectives
        manualPayments
        name
      }
      payoutMethods {
        id
        name
        data
        type
      }
    }
  }
`;

type EditCustomBankPaymentMethodDialogProps = {
  open: boolean;
  onClose: () => void;
  collectiveSlug: string;
  host: {
    id: string;
    currency: string;
    settings: any;
    connectedAccounts?: Array<{ id: string; service: string }>;
    payoutMethods?: Array<{
      id: string;
      name: string;
      data: any;
      type: string;
    }>;
  };
  onSuccess?: () => void;
};

export const EditCustomBankPaymentMethodDialog = ({
  open,
  onClose,
  collectiveSlug,
  host,
  onSuccess,
}: EditCustomBankPaymentMethodDialogProps) => {
  const { toast } = useToast();
  const [createPayoutMethod] = useMutation(createPayoutMethodMutation);
  const [editBankTransfer] = useMutation(editBankTransferMutation, {
    refetchQueries: [{ query: hostQuery, variables: { slug: collectiveSlug } }],
    awaitRefetchQueries: true,
  });

  const existingPayoutMethod = host.payoutMethods?.find(pm => pm.data?.isManualBankTransfer);
  const existingManualPaymentMethod = !!get(host, 'settings.paymentMethods.manual') && existingPayoutMethod;
  const useStructuredForm =
    !existingManualPaymentMethod || (existingManualPaymentMethod && existingPayoutMethod) ? true : false;
  const instructions = host.settings?.paymentMethods?.manual?.instructions || BANK_TRANSFER_DEFAULT_INSTRUCTIONS;

  // Fix currency if the existing payout method already matches the collective currency
  // or if it was already defined by Stripe
  const existingPayoutMethodMatchesCurrency = existingPayoutMethod?.data?.currency === host.currency;
  const isConnectedToStripe = host.connectedAccounts?.find?.(ca => ca.service === 'stripe');
  const fixedCurrency =
    useStructuredForm && (existingPayoutMethodMatchesCurrency || isConnectedToStripe) && host.currency;

  const initialValues = {
    ...(existingPayoutMethod || { data: { currency: fixedCurrency || host.currency } }),
    instructions,
  };

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (val: boolean) => void },
  ) => {
    const { data, instructions } = values;
    try {
      if (data?.currency && data?.type) {
        await createPayoutMethod({
          variables: {
            payoutMethod: { data: { ...data, isManualBankTransfer: true }, type: 'BANK_ACCOUNT' },
            account: { slug: collectiveSlug },
          },
        });
      }
      await editBankTransfer({
        variables: {
          key: 'paymentMethods.manual.instructions',
          value: instructions,
          account: { slug: collectiveSlug },
        },
      });
      setSubmitting(false);
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Bank transfer instructions have been updated" id="9BftpU" />,
      });
      onSuccess?.();
      onClose();
      window.scrollTo(0, 0);
    } catch (error: unknown) {
      toast({
        variant: 'error',
        message: (error instanceof Error ? error.message : null) || (
          <FormattedMessage defaultMessage="Failed to save bank transfer details" id="BankTransfer.Error" />
        ),
      });
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-xl" size="default">
        <DialogHeader>
          <DialogTitle>
            {existingManualPaymentMethod ? (
              <FormattedMessage id="paymentMethods.manual.edit" defaultMessage="Edit bank details" />
            ) : (
              <FormattedMessage id="paymentMethods.manual.add" defaultMessage="Set bank details" />
            )}
          </DialogTitle>
        </DialogHeader>
        <Formik initialValues={initialValues} onSubmit={handleSubmit}>
          {({ handleSubmit, isSubmitting, setFieldValue, dirty, values }) => (
            <form onSubmit={handleSubmit} className="space-y-4">
              {useStructuredForm && (
                <div className="w-full">
                  <PayoutBankInformationForm
                    getFieldName={string => string}
                    fixedCurrency={fixedCurrency}
                    ignoreBlockedCurrencies={false}
                    isNew
                    optional
                  />
                </div>
              )}

              <div className="mt-6 border-t pt-6">
                <Label className="mb-2 block text-sm font-bold">
                  <FormattedMessage
                    id="paymentMethods.manual.instructions.title"
                    defaultMessage="Define instructions"
                  />
                </Label>
                <p className="mb-2 text-xs text-gray-600">
                  <FormattedMessage
                    defaultMessage="Payment instructions template. You can use variables:"
                    id="CustomPaymentMethod.Instructions.Help"
                  />
                </p>
                <CustomPayoutMethodInstructionsVariablesHelp
                  variables={[
                    ...(useStructuredForm && values.data?.currency
                      ? [
                          {
                            variable: 'account',
                            description: (
                              <FormattedMessage
                                id="bankaccount.instructions.account"
                                defaultMessage="The bank account details you added above."
                              />
                            ),
                          },
                        ]
                      : []),
                    ...COMMON_TEMPLATE_VARIABLES,
                  ]}
                />
                <CustomPayoutMethodTemplateEditor
                  value={values.instructions}
                  onChange={value => setFieldValue('instructions', value)}
                  formattedValues={{
                    account: values.data ? formatAccountDetails(values.data) : '',
                    reference: '76400',
                    OrderId: '76400',
                    amount: '30,00 USD',
                    collective: 'acme',
                  }}
                  data-cy="bank-transfer-instructions-editor"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                </Button>
                <Button type="submit" disabled={isSubmitting || !dirty} loading={isSubmitting}>
                  <FormattedMessage id="save" defaultMessage="Save" />
                </Button>
              </DialogFooter>
            </form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

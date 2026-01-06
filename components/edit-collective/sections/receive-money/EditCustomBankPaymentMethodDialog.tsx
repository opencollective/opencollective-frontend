import React from 'react';
import { useMutation } from '@apollo/client';
import { Formik } from 'formik';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { v7 as uuidv7 } from 'uuid';

import { BANK_TRANSFER_DEFAULT_INSTRUCTIONS } from '../../../../lib/constants/payout-method';
import { getAccountReferenceInput } from '@/lib/collective';
import type { Account, EditCollectiveBankTransferHostQuery } from '@/lib/graphql/types/v2/graphql';

import { InputGroup } from '@/components/ui/Input';

import PayoutBankInformationForm from '../../../expenses/PayoutBankInformationForm';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { Label } from '../../../ui/Label';
import { useToast } from '../../../ui/useToast';
import { formatAccountDetails } from '../../utils';

import { COMMON_TEMPLATE_VARIABLES } from './constants';
import { CustomPayoutMethodInstructionsVariablesHelp } from './CustomPayoutMethodInstructionsVariablesHelp';
import { CustomPayoutMethodTemplateEditor } from './CustomPayoutMethodTemplateEditor';
import type { CustomPaymentProvider } from './EditCustomPaymentMethodDialog';
import {
  createPayoutMethodMutation,
  editCollectiveBankTransferHostQuery,
  editCustomPaymentMethodsMutation,
  getCacheUpdaterAfterEditCustomPaymentMethods,
} from './gql';

type EditCustomBankPaymentMethodDialogProps = {
  open: boolean;
  onClose: () => void;
  account: Pick<Account, 'slug' | 'currency' | 'legacyId'>;
  host: EditCollectiveBankTransferHostQuery['host'];
  onSuccess?: () => void;
  customPaymentProvider?: CustomPaymentProvider;
};

export const EditCustomBankPaymentMethodDialog = ({
  open,
  onClose,
  account,
  host,
  onSuccess,
  customPaymentProvider,
}: EditCustomBankPaymentMethodDialogProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [createPayoutMethod] = useMutation(createPayoutMethodMutation);
  const [editCustomPaymentMethods] = useMutation(editCustomPaymentMethodsMutation, {
    refetchQueries: [{ query: editCollectiveBankTransferHostQuery, variables: { slug: account.slug } }],
    awaitRefetchQueries: true,
  });

  // const existingPayoutMethod = host.payoutMethods?.find(pm => pm.data?.isManualBankTransfer);
  // const useStructuredForm =
  //   !existingManualPaymentMethod || (existingManualPaymentMethod && existingPayoutMethod) ? true : false;
  const useStructuredForm = false; // TODO

  // Fix currency if the existing payout method already matches the collective currency
  // or if it was already defined by Stripe
  // const existingPayoutMethodMatchesCurrency = existingPayoutMethod?.data?.currency === host.currency;
  const existingPayoutMethodMatchesCurrency = false; // TODO
  const isConnectedToStripe = host.connectedAccounts?.find?.(ca => ca.service === 'stripe');
  const fixedCurrency =
    useStructuredForm && (existingPayoutMethodMatchesCurrency || isConnectedToStripe) && host.currency;

  const initialValues: CustomPaymentProvider = {
    ...{
      id: customPaymentProvider?.id || uuidv7(),
      type: 'BANK_TRANSFER',
      currency: customPaymentProvider?.currency || host.currency,
      name: customPaymentProvider?.name || '',
      accountDetails: customPaymentProvider?.accountDetails || '',
      instructions: customPaymentProvider?.instructions || '',
      icon: customPaymentProvider?.icon || '',
      iconUrl: customPaymentProvider?.iconUrl || '',
    },
  };

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (val: boolean) => void },
  ) => {
    try {
      // if (data?.currency && data?.type) {
      //   await createPayoutMethod({
      //     variables: {
      //       payoutMethod: { data: { ...data, isManualBankTransfer: true }, type: 'BANK_ACCOUNT' },
      //       account: { slug: collectiveSlug },
      //     },
      //   });
      // }
      const allCustomMethods = [...(host.settings.customPaymentProviders || [])];
      if (customPaymentProvider) {
        const index = allCustomMethods.findIndex(method => method.id === customPaymentProvider.id);
        if (index !== -1) {
          allCustomMethods[index] = values;
        }
      } else {
        allCustomMethods.push(values);
      }

      await editCustomPaymentMethods({
        variables: { account: getAccountReferenceInput(account), value: allCustomMethods },
        update: getCacheUpdaterAfterEditCustomPaymentMethods(account),
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
            {customPaymentProvider ? (
              <FormattedMessage id="paymentMethods.manual.edit" defaultMessage="Edit bank details" />
            ) : (
              <FormattedMessage defaultMessage="Add bank details" id="7aqY1c" />
            )}
          </DialogTitle>
        </DialogHeader>
        <Formik initialValues={initialValues} onSubmit={handleSubmit}>
          {({ handleSubmit, setFieldTouched, errors, touched, isSubmitting, setFieldValue, dirty, values }) => (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="block text-sm font-bold" htmlFor="input-payment-processor-name">
                  <FormattedMessage defaultMessage="Bank Account Name" id="bTt+XL" />
                </Label>
                <p className="mt-1 mb-2 text-xs text-gray-600">
                  <FormattedMessage
                    defaultMessage="As displayed to the contributors in the payment method list"
                    id="QdKaSi"
                  />
                </p>
                <InputGroup
                  type="text"
                  id="input-payment-processor-name"
                  value={values.name}
                  className="w-full"
                  onChange={e => setFieldValue('name', e.target.value)}
                  onBlur={() => setFieldTouched('name', true)}
                  placeholder={intl.formatMessage({ defaultMessage: 'e.g., Venmo, CashApp, PayPal', id: 'NW/75T' })}
                  required
                  error={Boolean(errors.name && touched.name)}
                />
                {errors.name && touched.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

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
                    ...(useStructuredForm && values.currency
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
                    account: values.accountDetails ? formatAccountDetails(values.accountDetails) : '',
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

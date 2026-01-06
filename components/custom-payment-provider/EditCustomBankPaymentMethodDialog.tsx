import React from 'react';
import { useMutation } from '@apollo/client';
import { Formik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import { v7 as uuidv7 } from 'uuid';

import { getAccountReferenceInput } from '@/lib/collective';
import type { Account, EditCollectiveBankTransferHostQuery } from '@/lib/graphql/types/v2/graphql';
import { type CustomPaymentProvider, CustomPaymentProviderType } from '@/lib/graphql/types/v2/schema';

import { InputGroup } from '@/components/ui/Input';

import {
  editCollectiveBankTransferHostQuery,
  editCustomPaymentMethodsMutation,
  getCacheUpdaterAfterEditCustomPaymentMethods,
} from '../edit-collective/sections/receive-money/gql';
import PayoutBankInformationForm from '../expenses/PayoutBankInformationForm';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Label } from '../ui/Label';
import { useToast } from '../ui/useToast';

import { BANK_ACCOUNT_TEMPLATE_VARIABLE, COMMON_TEMPLATE_VARIABLES } from './constants';
import { CustomPaymentMethodInstructionsVariablesHelp } from './CustomPaymentMethodInstructionsVariablesHelp';
import { CustomPaymentMethodTemplateEditor } from './CustomPaymentMethodTemplateEditor';

type EditCustomBankPaymentMethodDialogProps = {
  open: boolean;
  onClose: () => void;
  account: Pick<Account, 'slug' | 'currency' | 'legacyId'>;
  host: EditCollectiveBankTransferHostQuery['host'];
  onSuccess?: () => void;
  customPaymentProvider?: CustomPaymentProvider;
};

const BANK_TRANSFER_DEFAULT_INSTRUCTIONS =
  '<div>Thank you for your contribution!<br><br>Here are the payment instructions. Be sure to include the reference details, so we can match your payment to the correct transaction. Sometimes it can take a few days for the funds to arrive and be confirmed. You will automatically be issued a receipt.<br><br><strong>Amount:</strong> {amount}<br><strong>Reference:</strong> {reference}<br><strong>Collective: </strong>{collective}<br><br>{account}&nbsp;</div>';

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
  const [editCustomPaymentMethods] = useMutation(editCustomPaymentMethodsMutation, {
    refetchQueries: [{ query: editCollectiveBankTransferHostQuery, variables: { slug: account.slug } }],
    awaitRefetchQueries: true,
  });

  const initialValues: CustomPaymentProvider = {
    ...{
      id: customPaymentProvider?.id || uuidv7(),
      type: CustomPaymentProviderType.BANK_TRANSFER,
      name: customPaymentProvider?.name || '',
      instructions: customPaymentProvider?.instructions || BANK_TRANSFER_DEFAULT_INSTRUCTIONS,
      icon: customPaymentProvider?.icon || 'Landmark',
      accountDetails: customPaymentProvider?.accountDetails || {},
    },
  };

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (val: boolean) => void },
  ) => {
    try {
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
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
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
                  placeholder={intl.formatMessage(
                    { id: 'examples', defaultMessage: 'e.g., {examples}' },
                    { examples: 'Bank Transfer (US), Bank Transfer (EUR)' },
                  )}
                  required
                  error={Boolean(errors.name && touched.name)}
                />
                {errors.name && touched.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div className="w-full">
                <PayoutBankInformationForm
                  host={account}
                  ignoreBlockedCurrencies={true}
                  isNew={true}
                  optional={false}
                  onlyDataFields={true}
                  getFieldName={fieldName => {
                    // Skip "data" prefix
                    if (fieldName === 'data') {
                      return 'accountDetails';
                    } else if (fieldName.startsWith('data.')) {
                      return `accountDetails.${fieldName.split('.').slice(1).join('.')}`;
                    } else {
                      return `__unknown_field_${fieldName}__`;
                    }
                  }}
                />
              </div>

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
                <CustomPaymentMethodInstructionsVariablesHelp
                  variables={[
                    ...(values.accountDetails.currency ? [BANK_ACCOUNT_TEMPLATE_VARIABLE] : []),
                    ...COMMON_TEMPLATE_VARIABLES,
                  ]}
                />
                <CustomPaymentMethodTemplateEditor
                  value={values.instructions}
                  onChange={value => setFieldValue('instructions', value)}
                  data-cy="bank-transfer-instructions-editor"
                  values={{
                    amount: { valueInCents: 3000, currency: account.currency },
                    collectiveSlug: 'example-collective',
                    OrderId: 76400,
                    accountDetails: values.accountDetails,
                  }}
                />
              </div>

              <DialogFooter className="mt-6">
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

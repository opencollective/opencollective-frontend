import React from 'react';
import { useMutation } from '@apollo/client';
import { Formik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import { getAccountReferenceInput } from '@/lib/collective';
import type {
  Account,
  EditCollectiveBankTransferHostQuery,
  ManualPaymentProvider,
} from '@/lib/graphql/types/v2/graphql';
import { ManualPaymentProviderType } from '@/lib/graphql/types/v2/schema';

import { InputGroup } from '@/components/ui/Input';

import {
  createManualPaymentProviderMutation,
  editCollectiveBankTransferHostQuery,
  updateManualPaymentProviderMutation,
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
  account: Pick<Account, 'slug' | 'currency'>;
  host: EditCollectiveBankTransferHostQuery['host'];
  onSuccess?: () => void;
  manualPaymentProvider?: ManualPaymentProvider;
};

const BANK_TRANSFER_DEFAULT_INSTRUCTIONS =
  '<div>To complete your contribution, please transfer the amount below using the provided bank details. Include the reference number exactly as shown to ensure your payment is matched correctly.<br><br>Your receipt will be issued automatically once the transfer is confirmed.<br><br><strong>Amount:</strong> {amount}<br><strong>Reference:</strong> {reference}<br><strong>Collective:</strong> {collective}<br><br>{account}</div>';

type FormValues = {
  name: string;
  instructions: string;
  icon: string;
  accountDetails: Record<string, unknown>;
};

export const EditCustomBankPaymentMethodDialog = ({
  open,
  onClose,
  account,
  onSuccess,
  manualPaymentProvider,
}: EditCustomBankPaymentMethodDialogProps) => {
  const intl = useIntl();
  const { toast } = useToast();

  const [createProvider] = useMutation(createManualPaymentProviderMutation, {
    refetchQueries: [{ query: editCollectiveBankTransferHostQuery, variables: { slug: account.slug } }],
    awaitRefetchQueries: true,
  });

  const [updateProvider] = useMutation(updateManualPaymentProviderMutation, {
    refetchQueries: [{ query: editCollectiveBankTransferHostQuery, variables: { slug: account.slug } }],
    awaitRefetchQueries: true,
  });

  const initialValues: FormValues = {
    name: manualPaymentProvider?.name || '',
    instructions: manualPaymentProvider?.instructions || BANK_TRANSFER_DEFAULT_INSTRUCTIONS,
    icon: manualPaymentProvider?.icon || 'Landmark',
    accountDetails: (manualPaymentProvider?.accountDetails as Record<string, unknown>) || {},
  };

  const handleSubmit = async (values: FormValues, { setSubmitting }: { setSubmitting: (val: boolean) => void }) => {
    try {
      if (manualPaymentProvider) {
        // Update existing
        await updateProvider({
          variables: {
            manualPaymentProvider: { id: manualPaymentProvider.id },
            input: {
              name: values.name,
              instructions: values.instructions,
              icon: values.icon,
              accountDetails: values.accountDetails,
            },
          },
        });
      } else {
        // Create new
        await createProvider({
          variables: {
            host: getAccountReferenceInput(account),
            manualPaymentProvider: {
              type: ManualPaymentProviderType.BANK_TRANSFER,
              name: values.name,
              instructions: values.instructions,
              icon: values.icon,
              accountDetails: values.accountDetails,
            },
          },
        });
      }
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
            {manualPaymentProvider ? (
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

              <div className="mt-6 border-t pt-6">
                <Label className="mb-1 block text-sm font-bold">
                  <FormattedMessage defaultMessage="Bank Account Details" id="yyMC04" />
                </Label>
                <p className="mb-4 text-xs text-gray-600">
                  <FormattedMessage
                    defaultMessage="Optional. Providing these details enables validation and allows you to use the <AccountVariable></AccountVariable> template variable in your instructions - a pre-formatted text with all the necessary bank details."
                    id="txRdqy"
                    values={{
                      AccountVariable: () => (
                        <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] text-slate-700">
                          {'{account}'}
                        </code>
                      ),
                    }}
                  />
                </p>
                <PayoutBankInformationForm
                  host={account}
                  ignoreBlockedCurrencies={true}
                  isNew={true}
                  optional={false}
                  onlyDataFields={true}
                  sectionHeaderClassName="text-sm font-medium"
                  labelClassName="text-xs"
                  errorClassName="text-xs"
                  fieldClassName="mt-4 flex-1"
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
                    defaultMessage="Payment instructions that will be displayed to the contributors. You can use variables:"
                    id="ghmpbR"
                  />
                </p>
                <CustomPaymentMethodInstructionsVariablesHelp
                  variables={[BANK_ACCOUNT_TEMPLATE_VARIABLE, ...COMMON_TEMPLATE_VARIABLES]}
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

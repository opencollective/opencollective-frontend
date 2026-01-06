import React from 'react';
import { Formik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import { v7 as uuidv7 } from 'uuid';

import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { InputGroup } from '../../../ui/Input';
import { Label } from '../../../ui/Label';

import { COMMON_TEMPLATE_VARIABLES } from './constants';
import { CustomPaymentMethodIconInput } from './CustomPaymentMethodIconInput';
import { CustomPayoutMethodInstructionsVariablesHelp } from './CustomPayoutMethodInstructionsVariablesHelp';
import { CustomPayoutMethodTemplateEditor } from './CustomPayoutMethodTemplateEditor';

export type CustomPaymentProvider = {
  id: string;
  type: 'OTHER' | 'BANK_TRANSFER';
  currency: string;
  name: string;
  accountDetails?: string;
  instructions: string;
  icon?: string;
  iconUrl?: string;
};

type EditCustomPaymentMethodDialogProps = {
  provider: CustomPaymentProvider | null | undefined;
  onSave: (values: CustomPaymentProvider, editingProvider: CustomPaymentProvider | null) => Promise<void>;
  onClose: () => void;
  defaultCurrency: string;
};

export const EditCustomPaymentMethodDialog = ({
  provider,
  onSave,
  onClose,
  defaultCurrency,
}: EditCustomPaymentMethodDialogProps) => {
  const intl = useIntl();

  const initialValues: CustomPaymentProvider = {
    id: provider?.id || uuidv7(),
    type: 'OTHER',
    currency: provider?.currency || defaultCurrency || 'USD',
    name: provider?.name || '',
    accountDetails: provider?.accountDetails || '',
    instructions: provider?.instructions || '',
    icon: provider?.icon || '',
    iconUrl: provider?.iconUrl || '',
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl" size="default">
        <DialogHeader className="mb-4">
          <DialogTitle>
            {provider ? (
              <FormattedMessage defaultMessage="Edit Custom Payment Method" id="CustomPaymentMethod.EditTitle" />
            ) : (
              <FormattedMessage defaultMessage="Add Custom Payment Method" id="CustomPaymentMethod.AddTitle" />
            )}
          </DialogTitle>
        </DialogHeader>
        <Formik
          initialValues={initialValues}
          validate={values => {
            const errors: Partial<Record<keyof CustomPaymentProvider, string>> = {};
            if (!values.name || values.name.trim() === '') {
              errors.name = intl.formatMessage({ defaultMessage: 'Name is required', id: 'CustomPaymentMethod.Name.Required' });
            }
            if (!values.instructions || values.instructions.trim() === '') {
              errors.instructions = intl.formatMessage({ defaultMessage: 'Instructions are required', id: 'CustomPaymentMethod.Instructions.Required' });
            }
            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            await onSave(values, provider || null);
            setSubmitting(false);
            // Modal will close automatically when editingId is set to null in handleSave
          }}
        >
          {({ handleSubmit, isSubmitting, values, setFieldValue, setFieldTouched, dirty, errors, touched }) => {
            return (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="block text-sm font-bold" htmlFor="input-payment-processor-name">
                    <FormattedMessage defaultMessage="Payment Processor Name" id="CustomPaymentMethod.Name" />
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
                  {errors.name && touched.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                <CustomPaymentMethodIconInput
                  icon={values.icon}
                  iconUrl={values.iconUrl}
                  onIconChange={icon => {
                    setFieldValue('icon', icon);
                    setFieldValue('iconUrl', '');
                  }}
                  onIconUrlChange={iconUrl => {
                    setFieldValue('iconUrl', iconUrl);
                    setFieldValue('icon', '');
                  }}
                />
                <div className="mt-6 border-t pt-6">
                  <Label className="mb-2 block text-sm font-bold">
                    <FormattedMessage defaultMessage="Instructions" id="CustomPaymentMethod.Instructions" />
                  </Label>
                  <p className="mb-2 text-xs text-gray-600">
                    <FormattedMessage
                      defaultMessage="Payment instructions template. You can use variables:"
                      id="CustomPaymentMethod.Instructions.Help"
                    />
                  </p>
                  <CustomPayoutMethodInstructionsVariablesHelp variables={COMMON_TEMPLATE_VARIABLES} />
                  <CustomPayoutMethodTemplateEditor
                    error={Boolean(errors.instructions && touched.instructions)}
                    value={values.instructions}
                    onChange={value => {
                      setFieldValue('instructions', value);
                      setFieldTouched('instructions', true);
                    }}
                    formattedValues={{
                      account: values.accountDetails || '',
                      reference: '76400',
                      OrderId: '76400',
                      amount: '30,00 USD',
                      collective: 'acme',
                    }}
                    data-cy="custom-payment-instructions-editor"
                  />
                  {errors.instructions && touched.instructions && (
                    <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                    <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !dirty || Object.keys(errors).length > 0} loading={isSubmitting}>
                    <FormattedMessage id="save" defaultMessage="Save" />
                  </Button>
                </DialogFooter>
              </form>
            );
          }}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

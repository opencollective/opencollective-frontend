import React from 'react';
import { Formik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import type { ManualPaymentProvider } from '@/lib/graphql/types/v2/graphql';
import { Currency } from '@/lib/graphql/types/v2/graphql';

import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { InputGroup } from '../ui/Input';
import { Label } from '../ui/Label';

import { DEFAULT_REFERENCE_TEMPLATE, EDIT_DIALOG_UNIFIED_VARIABLES_OTHER } from './constants';
import { CustomPaymentMethodIconInput } from './CustomPaymentMethodIconInput';
import { CustomPaymentMethodTemplateEditor } from './CustomPaymentMethodTemplateEditor';
import {
  ManualPaymentDialogTemplateVariablesCollapsible,
  PaymentReferenceTemplatePreviewHint,
} from './ManualPaymentTemplateDialogHelpers';

type FormValues = {
  name: string;
  instructions: string;
  icon: string;
  referenceTemplate: string;
};

type EditCustomPaymentMethodDialogProps = {
  provider: ManualPaymentProvider | null | undefined;
  onSave: (values: FormValues, editingProvider?: ManualPaymentProvider) => Promise<void>;
  onClose: () => void;
  defaultCurrency: string;
};

export const EditCustomPaymentMethodDialog = ({ provider, onSave, onClose }: EditCustomPaymentMethodDialogProps) => {
  const intl = useIntl();

  const initialValues: FormValues = {
    name: provider?.name || '',
    instructions: provider?.instructions || '',
    icon: provider?.icon || '',
    referenceTemplate: provider?.referenceTemplate?.trim() ? provider.referenceTemplate : DEFAULT_REFERENCE_TEMPLATE,
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
              <FormattedMessage defaultMessage="Edit Custom Payment Method" id="rqUv7I" />
            ) : (
              <FormattedMessage defaultMessage="Add Custom Payment Method" id="//3qi9" />
            )}
          </DialogTitle>
        </DialogHeader>
        <Formik
          initialValues={initialValues}
          validate={values => {
            const errors: Partial<Record<keyof FormValues, string>> = {};
            if (!values.name || values.name.trim() === '') {
              errors.name = intl.formatMessage({
                defaultMessage: 'Name is required',
                id: 'CustomPaymentMethod.Name.Required',
              });
            }
            if (!values.instructions || values.instructions.trim() === '') {
              errors.instructions = intl.formatMessage({
                defaultMessage: 'Instructions are required',
                id: 'CustomPaymentMethod.Instructions.Required',
              });
            }
            if (!values.referenceTemplate || values.referenceTemplate.trim() === '') {
              errors.referenceTemplate = intl.formatMessage({
                defaultMessage: 'Payment reference template is required',
                id: 'CustomPaymentMethod.ReferenceTemplate.Required',
              });
            }
            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
            await onSave(values, provider || undefined);
            setSubmitting(false);
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
                    placeholder={intl.formatMessage(
                      { id: 'examples', defaultMessage: 'e.g., {examples}' },
                      { examples: 'Venmo, CashApp, PayPal' },
                    )}
                    required
                    error={Boolean(errors.name && touched.name)}
                  />
                  {errors.name && touched.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                <CustomPaymentMethodIconInput
                  icon={values.icon}
                  onIconChange={icon => {
                    setFieldValue('icon', icon);
                    setFieldValue('iconUrl', '');
                  }}
                />
                <div className="mt-6 border-t pt-6">
                  <ManualPaymentDialogTemplateVariablesCollapsible variables={EDIT_DIALOG_UNIFIED_VARIABLES_OTHER} />
                </div>
                <div className="mt-6">
                  <Label className="mb-2 block text-sm font-bold" htmlFor="input-payment-reference-template">
                    <FormattedMessage
                      defaultMessage="Payment reference"
                      id="CustomPaymentMethod.ReferenceTemplate.Title"
                    />
                  </Label>
                  <p className="mb-2 text-xs text-gray-600">
                    <FormattedMessage
                      defaultMessage="What payers enter as the transfer reference. Shown as {reference} in instructions - use characters their bank or payment app supports."
                      id="CustomPaymentMethod.ReferenceTemplate.Description"
                      values={{
                        reference: (
                          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] text-slate-700">
                            {'{reference}'}
                          </code>
                        ),
                      }}
                    />
                  </p>
                  <InputGroup
                    type="text"
                    id="input-payment-reference-template"
                    value={values.referenceTemplate}
                    className="w-full font-mono text-xs"
                    onChange={e => setFieldValue('referenceTemplate', e.target.value)}
                    onBlur={() => setFieldTouched('referenceTemplate', true)}
                    placeholder={DEFAULT_REFERENCE_TEMPLATE}
                    error={Boolean(errors.referenceTemplate && touched.referenceTemplate)}
                    data-cy="custom-payment-reference-template"
                  />
                  <PaymentReferenceTemplatePreviewHint
                    referenceTemplate={values.referenceTemplate}
                    previewValues={{
                      amount: { valueInCents: 3000, currency: Currency.USD },
                      collectiveSlug: 'acme',
                      OrderId: 76400,
                    }}
                  />
                  {errors.referenceTemplate && touched.referenceTemplate && (
                    <p className="mt-1 text-sm text-red-600">{errors.referenceTemplate}</p>
                  )}
                </div>
                <div className="mt-6">
                  <Label className="mb-2 block text-sm font-bold">
                    <FormattedMessage defaultMessage="Instructions" id="sV2v5L" />
                  </Label>
                  <p className="mb-2 text-xs text-gray-600">
                    <FormattedMessage
                      defaultMessage="Rich text instructions for contributors. Use the variables from the section above."
                      id="CustomPaymentMethod.Instructions.IntroAboveVariables"
                    />
                  </p>
                  <CustomPaymentMethodTemplateEditor
                    error={Boolean(errors.instructions && touched.instructions)}
                    value={values.instructions}
                    onChange={value => {
                      setFieldValue('instructions', value);
                      setFieldTouched('instructions', true);
                    }}
                    referenceTemplate={values.referenceTemplate}
                    values={{
                      amount: { valueInCents: 3000, currency: Currency.USD },
                      collectiveSlug: 'acme',
                      OrderId: 76400,
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
                  <Button
                    type="submit"
                    disabled={isSubmitting || !dirty || Object.keys(errors).length > 0}
                    loading={isSubmitting}
                  >
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

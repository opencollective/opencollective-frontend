import React from 'react';
import { useMutation } from '@apollo/client';
import { Field, Form, Formik } from 'formik';
import { cloneDeep, pick } from 'lodash';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { requireFields, verifyEmailPattern, verifyURLPattern } from '../../lib/form-utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { DashboardVendorsQuery } from '../../lib/graphql/types/v2/graphql';
import { omitDeep } from '../../lib/utils';

import { useDrawerActionsContainer } from '../Drawer';
import PayoutMethodForm from '../expenses/PayoutMethodForm';
import PayoutMethodSelect from '../expenses/PayoutMethodSelect';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputGroup from '../StyledInputGroup';
import StyledInputLocation from '../StyledInputLocation';
import StyledSelect from '../StyledSelect';
import StyledTextarea from '../StyledTextarea';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { useToast } from '../ui/useToast';

import { vendorFieldFragment, VendorFieldsFragment } from './queries';

const FIELD_LABEL_PROPS = { fontSize: 16, fontWeight: 700 };

const createVendorMutation = gql`
  mutation CreateVendor($vendor: VendorCreateInput!, $host: AccountReferenceInput!) {
    createVendor(host: $host, vendor: $vendor) {
      id
      ...VendorFields
    }
  }
  ${vendorFieldFragment}
`;

const editVendorMutation = gql`
  mutation EditVendor($vendor: VendorEditInput!) {
    editVendor(vendor: $vendor) {
      id
      ...VendorFields
    }
  }
  ${vendorFieldFragment}
`;

const EDITABLE_FIELDS = [
  'name',
  'legalName',
  'location',
  'vendorInfo',
  'vendorInfo.taxFormUrl',
  'vendorInfo.taxFormRequired',
  'vendorInfo.taxType',
  'vendorInfo.taxId',
  'vendorInfo.contact.name',
  'vendorInfo.contact.email',
  'payoutMethod',
  'vendorInfo.notes',
];

type VendorFormProps = {
  vendor?: VendorFieldsFragment;
  host?: Omit<DashboardVendorsQuery['account'], 'vendors'>;
  onSuccess?: Function;
  onCancel: () => void;
  isModal?: boolean;
};

const validateVendorForm = values => {
  const requiredFields = ['name'];
  if (values.vendorInfo?.taxType === 'OTHER') {
    requiredFields.push('vendorInfo.otherTaxType');
  }
  const errors = requireFields(values, requiredFields);

  if (values.vendorInfo?.contact?.email) {
    verifyEmailPattern(errors, values, 'vendorInfo.contact.email');
  }
  if (values.vendorInfo?.taxFormUrl) {
    verifyURLPattern(errors, values, 'vendorInfo.taxFormUrl');
  }
  if (values.imageUrl) {
    verifyURLPattern(errors, values, 'imageUrl');
  }

  return errors;
};

const VendorForm = ({ vendor, host, onSuccess, onCancel, isModal }: VendorFormProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [createVendor, { loading: isCreating }] = useMutation(createVendorMutation, { context: API_V2_CONTEXT });
  const [editVendor, { loading: isEditing }] = useMutation(editVendorMutation, { context: API_V2_CONTEXT });
  const drawerActionsContainer = useDrawerActionsContainer();

  const handleSubmit = async values => {
    const data = omitDeep(
      {
        ...pick(values, EDITABLE_FIELDS),
        vendorInfo: {
          ...pick(values.vendorInfo, ['contact', 'notes', 'taxFormUrl', 'taxFormRequired', 'taxId', 'taxType']),
          taxType:
            values.vendorInfo?.taxType === 'OTHER' ? values.vendorInfo?.otherTaxType : values.vendorInfo?.taxType,
        },
      },
      ['__typename'],
    );

    try {
      if (vendor) {
        await editVendor({ variables: { vendor: { ...data, id: vendor.id } } });
        toast({
          variant: 'success',
          message: <FormattedMessage defaultMessage="Vendor Updated" />,
        });
      } else {
        await createVendor({ variables: { vendor: data, host: pick(host, ['id', 'slug']) } });
        toast({
          variant: 'success',
          message: <FormattedMessage defaultMessage="Vendor Created" />,
        });
      }
      onSuccess?.();
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  const taxOptions = [
    { label: <FormattedMessage id="Account.None" defaultMessage="None" />, value: undefined },
    { label: 'EIN', value: 'EIN' },
    { label: 'VAT', value: 'VAT' },
    { label: 'GST', value: 'GST' },
    { label: <FormattedMessage id="taxType.Other" defaultMessage="Other" />, value: 'OTHER' },
  ];
  const initialValues = cloneDeep(pick(vendor, EDITABLE_FIELDS));
  if (vendor?.hasImage !== true) {
    initialValues.imageUrl = null;
  }
  if (initialValues.vendorInfo?.taxType && !['EIN', 'VAT', 'GST'].includes(initialValues.vendorInfo?.taxType)) {
    initialValues.vendorInfo['otherTaxType'] = initialValues.vendorInfo?.taxType;
    initialValues.vendorInfo.taxType = 'OTHER';
  }
  if (vendor?.payoutMethods?.length > 0) {
    initialValues['payoutMethod'] = vendor.payoutMethods[0];
  }
  const loading = isCreating || isEditing;

  return (
    <div>
      <div className="flex justify-between text-xl font-bold">
        {vendor ? (
          <FormattedMessage id="vendor.edit" defaultMessage="Edit Vendor" />
        ) : (
          <FormattedMessage defaultMessage="Create Vendor" />
        )}
        {isModal && (
          <button
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-transparent text-slate-500 ring-2 ring-transparent transition-colors hover:text-slate-950  focus:outline-none focus-visible:ring-black active:ring-black group-hover:border-slate-200 group-hover:bg-white data-[state=open]:ring-black"
          >
            <X size="20px" />
          </button>
        )}
      </div>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validate={validateVendorForm}>
        {formik => {
          const actionButtons = (
            <div className="flex flex-grow justify-between gap-2">
              <Button onClick={onCancel} variant="outline" className="rounded-full" disabled={loading}>
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </Button>
              <Button onClick={formik.submitForm} loading={loading} className="rounded-full">
                {vendor ? (
                  <FormattedMessage id="Vendor.Update" defaultMessage="Update vendor" />
                ) : (
                  <FormattedMessage defaultMessage="Create vendor" />
                )}
              </Button>
            </div>
          );

          return (
            <Form data-cy="vendor-form">
              <div className="flex justify-stretch gap-4">
                <div className="flex-grow">
                  <StyledInputFormikField
                    name="name"
                    label={intl.formatMessage({ defaultMessage: "Vendor's name" })}
                    labelProps={FIELD_LABEL_PROPS}
                    mt={3}
                    required
                  >
                    {({ field }) => <StyledInput {...field} width="100%" maxWidth={500} maxLength={60} />}
                  </StyledInputFormikField>
                </div>
              </div>
              <StyledInputFormikField
                name="legalName"
                label={intl.formatMessage({ defaultMessage: "Vendor's legal name" })}
                labelProps={FIELD_LABEL_PROPS}
                required={false}
                mt={3}
              >
                {({ field }) => (
                  <StyledInput {...field} width="100%" maxWidth={500} maxLength={60} placeholder={formik.values.name} />
                )}
              </StyledInputFormikField>
              <StyledInputFormikField
                name="vendorInfo.taxFormRequired"
                label={intl.formatMessage({ id: 'TaxForm', defaultMessage: 'Tax form' })}
                labelProps={FIELD_LABEL_PROPS}
                required={false}
                mt={3}
              >
                {({ field, form }) => (
                  <div className="flex items-center gap-2">
                    <Switch
                      {...field}
                      checked={field.value}
                      onCheckedChange={checked => {
                        form.setFieldValue(field.name, checked);
                        if (!checked) {
                          form.setFieldValue(field.name, null);
                        }
                      }}
                    />
                    <label htmlFor="taxRequired" className="font-normal">
                      <FormattedMessage defaultMessage="Requires tax form" />
                    </label>
                  </div>
                )}
              </StyledInputFormikField>
              {formik.values.vendorInfo?.taxFormRequired && (
                <StyledInputFormikField
                  name="vendorInfo.taxFormUrl"
                  label={intl.formatMessage({ defaultMessage: 'Tax form URL' })}
                  labelProps={FIELD_LABEL_PROPS}
                  required={false}
                  mt={3}
                >
                  {({ field }) => (
                    <StyledInputGroup {...field} prepend="https://" width="100%" maxWidth={500} maxLength={60} />
                  )}
                </StyledInputFormikField>
              )}
              <p className="mb-3 mt-4 text-base font-bold">
                <FormattedMessage defaultMessage="Tax identification" />
              </p>
              <StyledInputFormikField
                name="vendorInfo.taxType"
                label={intl.formatMessage({ defaultMessage: 'Identification system' })}
                labelProps={{ ...FIELD_LABEL_PROPS, fontWeight: 400 }}
                required={false}
                mt={3}
              >
                {({ field }) => (
                  <StyledSelect
                    {...field}
                    width="100%"
                    options={taxOptions}
                    value={taxOptions.find(c => c.value === field.value) || null}
                    onChange={({ value }) => formik.setFieldValue(field.name, value)}
                  />
                )}
              </StyledInputFormikField>
              {formik.values?.vendorInfo?.taxType === 'OTHER' && (
                <StyledInputFormikField
                  name="vendorInfo.otherTaxType"
                  label={intl.formatMessage({ defaultMessage: 'Identification system' })}
                  labelProps={{ ...FIELD_LABEL_PROPS, fontWeight: 400 }}
                  required={true}
                  mt={3}
                >
                  {({ field }) => <StyledInput {...field} width="100%" maxWidth={500} maxLength={60} />}
                </StyledInputFormikField>
              )}
              <StyledInputFormikField
                name="vendorInfo.taxId"
                label={intl.formatMessage({ defaultMessage: 'ID Number' })}
                labelProps={{ ...FIELD_LABEL_PROPS, fontWeight: 400 }}
                required={formik.values?.vendorInfo?.taxType !== undefined}
                mt={3}
              >
                {({ field }) => <StyledInput {...field} width="100%" maxWidth={500} maxLength={60} />}
              </StyledInputFormikField>

              <p className="mb-3 mt-4 text-base font-bold">
                <FormattedMessage defaultMessage="Mailing address" />
              </p>
              <StyledInputLocation
                onChange={values => {
                  formik.setFieldValue('location', values);
                }}
                location={formik.values.location}
                errors={formik.errors.location as object}
                required={false}
              />
              <StyledInputFormikField
                name="vendorInfo.contact.name"
                label={intl.formatMessage({ id: 'ContactName', defaultMessage: 'Contact name' })}
                labelProps={FIELD_LABEL_PROPS}
                required={false}
                mt={3}
              >
                {({ field }) => <StyledInput {...field} width="100%" maxWidth={500} maxLength={60} />}
              </StyledInputFormikField>
              <StyledInputFormikField
                name="vendorInfo.contact.email"
                label={intl.formatMessage({ defaultMessage: "Contact's email" })}
                labelProps={FIELD_LABEL_PROPS}
                required={false}
                mt={3}
              >
                {({ field }) => (
                  <StyledInput
                    {...field}
                    type="email"
                    width="100%"
                    maxWidth={500}
                    maxLength={60}
                    placeholder="t.anderson@opencollective.com"
                  />
                )}
              </StyledInputFormikField>
              <div className="mt-3 flex-grow">
                <p className="mb-2 text-[#4D4F51]">
                  <FormattedMessage
                    id="OptionalFieldLabel"
                    defaultMessage="{field} (optional)"
                    values={{
                      field: (
                        <span className="text-base font-bold text-black">
                          <FormattedMessage id="ExpenseForm.PayoutOptionLabel" defaultMessage="Payout method" />
                        </span>
                      ),
                    }}
                  />
                </p>
                <PayoutMethodSelect
                  collective={{ host } as any}
                  payoutMethods={vendor?.payoutMethods || []}
                  payoutMethod={formik.values.payoutMethod}
                  onChange={({ value }) => formik.setFieldValue('payoutMethod', value)}
                  allowNull
                />
              </div>
              {formik.values.payoutMethod && (
                <Field name="payoutMethod">
                  {({ field }) => (
                    <div className="mt-3  flex-grow">
                      <PayoutMethodForm
                        fieldsPrefix="payoutMethod"
                        payoutMethod={field.value}
                        host={host}
                        required={Boolean(formik.values.payoutMethod)}
                      />
                    </div>
                  )}
                </Field>
              )}
              <StyledInputFormikField
                name="vendorInfo.notes"
                label={intl.formatMessage({ id: 'expense.notes', defaultMessage: 'Notes' })}
                labelProps={FIELD_LABEL_PROPS}
                required={false}
                mt={3}
              >
                {({ field }) => (
                  <StyledTextarea {...field} width="100%" maxWidth={500} maxLength={60} minHeight={160} autoSize />
                )}
              </StyledInputFormikField>

              {drawerActionsContainer ? (
                createPortal(actionButtons, drawerActionsContainer)
              ) : (
                <div className="mt-6">{actionButtons}</div>
              )}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default VendorForm;

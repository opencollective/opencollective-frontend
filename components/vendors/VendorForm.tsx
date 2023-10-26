import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { Field, Form, Formik } from 'formik';
import { cloneDeep, pick } from 'lodash';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
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
import { H4 } from '../Text';
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
  'vendorInfo.taxFormUrl',
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
};

const VendorForm = ({ vendor, host, onSuccess, onCancel }: VendorFormProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const initialValues = cloneDeep(pick(vendor, EDITABLE_FIELDS) || {});

  const [createVendor] = useMutation(createVendorMutation, { context: API_V2_CONTEXT });
  const [editVendor] = useMutation(editVendorMutation, { context: API_V2_CONTEXT });
  const drawerActionsContainer = useDrawerActionsContainer();

  const handleSubmit = async values => {
    const data = omitDeep(
      {
        ...pick(values, EDITABLE_FIELDS),
        vendorInfo: {
          ...pick(values.vendorInfo, ['contact', 'notes', 'taxFormUrl', 'taxId', 'taxType']),
          taxType: values.vendorInfo?.taxType === 'OTHER' ? values.vendorInfo.otherTaxType : values.vendorInfo.taxType,
        },
      },
      ['__typename'],
    );

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
  };

  const taxOptions = [
    { label: 'EIN', value: 'EIN' },
    { label: 'VAT', value: 'VAT' },
    { label: 'GST', value: 'GST' },
    { label: <FormattedMessage defaultMessage="Other" />, value: 'OTHER' },
  ];

  return (
    <div>
      <H4 mb={32}>
        {vendor ? (
          <FormattedMessage defaultMessage="Edit Vendor" />
        ) : (
          <FormattedMessage defaultMessage="Create Vendor" />
        )}
      </H4>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {formik => (
          <Form data-cy="vendor-form">
            <StyledInputFormikField
              name="name"
              label={intl.formatMessage({ defaultMessage: "Vendor's name" })}
              labelProps={FIELD_LABEL_PROPS}
              mt={3}
              required
            >
              {({ field }) => <StyledInput {...field} width="100%" maxWidth={500} maxLength={60} />}
            </StyledInputFormikField>
            <StyledInputFormikField
              name="legalName"
              label={intl.formatMessage({ defaultMessage: "Vendor's legal name" })}
              labelProps={FIELD_LABEL_PROPS}
              mt={3}
            >
              {({ field }) => (
                <StyledInput {...field} width="100%" maxWidth={500} maxLength={60} placeholder={formik.values.name} />
              )}
            </StyledInputFormikField>
            <StyledInputFormikField
              name="taxRequired"
              id="taxRequired"
              label={intl.formatMessage({ defaultMessage: 'Tax form' })}
              labelProps={FIELD_LABEL_PROPS}
              mt={3}
            >
              {({ field, form }) => (
                <div className="flex items-center gap-2">
                  <Switch
                    {...field}
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
            {formik.values.taxRequired && (
              <StyledInputFormikField
                name="vendorInfo.taxFormUrl"
                label={intl.formatMessage({ defaultMessage: 'Tax form URL' })}
                labelProps={FIELD_LABEL_PROPS}
                mt={3}
                required={formik.values.taxRequired}
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
                label={intl.formatMessage({ defaultMessage: 'Identification sytem' })}
                labelProps={{ ...FIELD_LABEL_PROPS, fontWeight: 400 }}
                mt={3}
              >
                {({ field }) => <StyledInput {...field} width="100%" maxWidth={500} maxLength={60} />}
              </StyledInputFormikField>
            )}
            <StyledInputFormikField
              name="vendorInfo.taxId"
              label={intl.formatMessage({ defaultMessage: 'ID Number' })}
              labelProps={{ ...FIELD_LABEL_PROPS, fontWeight: 400 }}
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
              label={intl.formatMessage({ defaultMessage: 'Contact name' })}
              labelProps={FIELD_LABEL_PROPS}
              mt={3}
            >
              {({ field }) => <StyledInput {...field} width="100%" maxWidth={500} maxLength={60} />}
            </StyledInputFormikField>
            <StyledInputFormikField
              name="vendorInfo.contact.email"
              label={intl.formatMessage({ defaultMessage: "Contact's email" })}
              labelProps={FIELD_LABEL_PROPS}
              mt={3}
            >
              {({ field }) => (
                <StyledInput
                  {...field}
                  width="100%"
                  maxWidth={500}
                  maxLength={60}
                  placeholder="t.anderson@opencollective.com"
                />
              )}
            </StyledInputFormikField>
            <StyledInputFormikField
              name="payoutMethod"
              htmlFor="payout-method"
              flex="1"
              mt={3}
              label={intl.formatMessage({ defaultMessage: 'Payout method' })}
              labelProps={FIELD_LABEL_PROPS}
            >
              {({ field }) => (
                <PayoutMethodSelect
                  {...field}
                  payoutMethod={field.value}
                  collective={{ host }}
                  payoutMethods={vendor?.payoutMethods || []}
                  onChange={({ value }) => formik.setFieldValue('payoutMethod', value)}
                />
              )}
            </StyledInputFormikField>
            {formik.values.payoutMethod && (
              <Field name="payoutMethod">
                {({ field }) => (
                  <div className="mt-3 flex-grow">
                    <PayoutMethodForm fieldsPrefix="payoutMethod" payoutMethod={field.value} host={host} />
                  </div>
                )}
              </Field>
            )}
            <StyledInputFormikField
              name="vendorInfo.notes"
              label={intl.formatMessage({ defaultMessage: 'Notes' })}
              labelProps={FIELD_LABEL_PROPS}
              mt={3}
            >
              {({ field }) => (
                <StyledTextarea {...field} width="100%" maxWidth={500} maxLength={60} minHeight={160} autoSize />
              )}
            </StyledInputFormikField>

            {drawerActionsContainer &&
              createPortal(
                <div className="flex flex-grow justify-between gap-2">
                  <Button onClick={onCancel} variant="outline" className="rounded-full">
                    <FormattedMessage id="Cancel" defaultMessage="Cancel" />
                  </Button>
                  <Button onClick={formik.submitForm} className="rounded-full">
                    {vendor ? (
                      <FormattedMessage id="Vendor.Update" defaultMessage="Update vendor" />
                    ) : (
                      <FormattedMessage id="Vendors.Create" defaultMessage="Create vendor" />
                    )}
                  </Button>
                </div>,
                drawerActionsContainer,
              )}
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default VendorForm;

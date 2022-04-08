import React from 'react';
import PropTypes from 'prop-types';
import { TaxType } from '@opencollective/taxes';
import { isNil } from 'lodash';
import { useIntl } from 'react-intl';

import { createError, ERROR } from '../../lib/errors';
import { verifyValueInRange } from '../../lib/form-utils';

import { Grid } from '../Grid';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledSelect from '../StyledSelect';

export const validateTaxGST = (intl, tax) => {
  const errors = {};
  if (tax.type !== TaxType.GST) {
    return errors;
  }

  if (isNaN(tax.rate) || isNil(tax.rate)) {
    errors.rate = createError(ERROR.FORM_FIELD_REQUIRED);
  } else {
    verifyValueInRange(intl, errors, tax, 'rate', 0, 100);
  }

  // ID number is required if there's a tax rate
  if (tax.rate && !tax.idNumber) {
    errors.idNumber = createError(ERROR.FORM_FIELD_REQUIRED);
  }

  return errors;
};

const ExpenseGSTFormikFields = ({ formik, isOptional }) => {
  const intl = useIntl();

  // If mounted, it means that the form is subject to GST. Let's make sure we initialize taxes field accordingly
  React.useEffect(() => {
    if (!formik.values.taxes?.[0]?.type !== TaxType.GST) {
      formik.setFieldValue('taxes.0', { ...formik.values.taxes?.[0], type: TaxType.GST, rate: 15 });
    }
  }, []);

  return (
    <Grid gridTemplateColumns="120px minmax(120px, 1fr)" gridGap={2}>
      <StyledInputFormikField
        name="taxes.0.rate"
        htmlFor="GST-rate"
        label={intl.formatMessage({ defaultMessage: 'GST rate' })}
        inputType="number"
        required={!isOptional}
      >
        {({ field }) => (
          <StyledSelect
            isSearchable={false}
            name="taxes.0.rate"
            inputId={field.id}
            error={field.error}
            onBlur={() => formik.setFieldTouched(field.name, true)}
            onChange={({ value }) => formik.setFieldValue(field.name, value)}
            options={[0, 15].map(value => ({ value, label: `${value}%` }))}
            value={!isNil(field.value) && { value: field.value, label: `${field.value}%` }}
          />
        )}
      </StyledInputFormikField>
      <StyledInputFormikField
        name="taxes.0.idNumber"
        htmlFor="GST-number"
        label={intl.formatMessage({ defaultMessage: 'GST identifier' })}
        required={!isOptional && Boolean(formik.values.taxes?.[0]?.rate)}
        mr={2}
      >
        {({ field }) => (
          <StyledInput
            {...field}
            placeholder={intl.formatMessage(
              { id: 'examples', defaultMessage: 'e.g., {examples}' },
              { examples: '123456789' },
            )}
          />
        )}
      </StyledInputFormikField>
    </Grid>
  );
};

ExpenseGSTFormikFields.propTypes = {
  formik: PropTypes.object,
  isOptional: PropTypes.bool,
};

export default ExpenseGSTFormikFields;

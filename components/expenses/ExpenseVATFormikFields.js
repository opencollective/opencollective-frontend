import React from 'react';
import PropTypes from 'prop-types';
import { checkVATNumberFormat, TaxType } from '@opencollective/taxes';
import { isNil, round } from 'lodash';
import { useIntl } from 'react-intl';

import { createError, ERROR } from '../../lib/errors';
import { verifyValueInRange } from '../../lib/form-utils';

import { Grid } from '../Grid';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputGroup from '../StyledInputGroup';

export const validateTaxVAT = (intl, tax) => {
  const errors = {};
  if (tax.type !== TaxType.VAT) {
    return errors;
  }

  if (isNaN(tax.rate) || isNil(tax.rate)) {
    errors.rate = createError(ERROR.FORM_FIELD_REQUIRED);
  } else {
    verifyValueInRange(intl, errors, tax, 'rate', 0, 1);
  }

  // ID number is required if there's a tax rate
  if (tax.rate) {
    if (!tax.idNumber) {
      errors.idNumber = createError(ERROR.FORM_FIELD_REQUIRED);
    } else if (!checkVATNumberFormat(tax.idNumber).isValid) {
      errors.idNumber = createError(ERROR.FORM_FIELD_PATTERN);
    }
  }

  return errors;
};

const ExpenseVATFormikFields = ({ formik, isOptional }) => {
  const intl = useIntl();

  // If mounted, it means that the form is subject to VAT. Let's make sure we initialize taxes field accordingly
  React.useEffect(() => {
    if (!formik.values.taxes?.[0]?.type !== TaxType.VAT) {
      formik.setFieldValue('taxes.0.type', TaxType.VAT);
    }
  }, []);

  return (
    <Grid gridTemplateColumns="120px minmax(120px, 1fr)" gridGap={2}>
      <StyledInputFormikField
        name="taxes.0.rate"
        htmlFor="vat-rate"
        label={intl.formatMessage({ defaultMessage: 'VAT rate' })}
        inputType="number"
        required={!isOptional}
      >
        {({ field }) => (
          <StyledInputGroup
            {...field}
            value={round(field.value * 100, 2)}
            onChange={e => formik.setFieldValue(e.target.name, round(e.target.value / 100, 4))}
            append="%"
            min={0}
            max={100}
            step="0.01"
          />
        )}
      </StyledInputFormikField>
      <StyledInputFormikField
        name="taxes.0.idNumber"
        htmlFor="vat-number"
        label={intl.formatMessage({ defaultMessage: 'VAT identifier' })}
        required={!isOptional && Boolean(formik.values.taxes?.[0]?.rate)}
        mr={2}
      >
        {({ field }) => (
          <StyledInput
            {...field}
            placeholder={intl.formatMessage(
              { id: 'examples', defaultMessage: 'e.g., {examples}' },
              { examples: 'EU000011111' },
            )}
          />
        )}
      </StyledInputFormikField>
    </Grid>
  );
};

ExpenseVATFormikFields.propTypes = {
  formik: PropTypes.object,
  isOptional: PropTypes.bool,
};

export default ExpenseVATFormikFields;

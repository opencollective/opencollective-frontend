import React from 'react';
import PropTypes from 'prop-types';
import { GST_RATE_PERCENT, TaxType } from '@opencollective/taxes';
import { round } from 'lodash';
import { useIntl } from 'react-intl';

import { createError, ERROR } from '../../lib/errors';

import { Grid } from '../Grid';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputGroup from '../StyledInputGroup';

export const validateTaxGST = (intl, tax) => {
  const errors = {};
  if (tax.type !== TaxType.GST) {
    return errors;
  }

  // Not validating rate since it can't be customized
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
      formik.setFieldValue('taxes.0', { ...formik.values.taxes?.[0], type: TaxType.GST, rate: GST_RATE_PERCENT / 100 });
    }
  }, []);

  return (
    <Grid gridTemplateColumns="75px minmax(120px, 1fr)" gridGap={2}>
      <StyledInputFormikField
        name="taxes.0.rate"
        htmlFor="GST-rate"
        label={intl.formatMessage({ defaultMessage: 'GST rate' })}
        inputType="number"
        required
      >
        {({ field }) => (
          <StyledInputGroup
            {...field}
            value={round(field.value * 100, 2)}
            append="%"
            min={0}
            max={100}
            step="0.01"
            disabled
          />
        )}
      </StyledInputFormikField>
      <StyledInputFormikField
        name="taxes.0.idNumber"
        htmlFor="GST-number"
        label={intl.formatMessage({ defaultMessage: 'GST number' })}
        required={!isOptional}
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

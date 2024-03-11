import React from 'react';
import PropTypes from 'prop-types';
import { Field } from 'formik';
import { compact, get, set } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';
import { isEmail } from 'validator';

import { PayoutMethodType } from '../../lib/constants/payout-method';
import { createError, ERROR } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';

import { Box } from '../Grid';
import StyledCheckbox from '../StyledCheckbox';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledTextarea from '../StyledTextarea';

import PayoutBankInformationForm from './PayoutBankInformationForm';

const msg = defineMessages({
  paypalEmail: {
    id: 'Paypal.Email',
    defaultMessage: 'PayPal email',
  },
  content: {
    id: 'editCollective.menu.info',
    defaultMessage: 'Info',
  },
  savePayout: {
    id: 'ExpenseForm.SavePayout',
    defaultMessage: 'Save this info for future payouts',
  },
});

/** Use this function to validate the payout method */
export const validatePayoutMethod = payoutMethod => {
  const errors = {};

  if (!payoutMethod || !payoutMethod.type) {
    set(errors, 'type', createError(ERROR.FORM_FIELD_REQUIRED));
  } else if (payoutMethod.type === PayoutMethodType.PAYPAL) {
    const email = get(payoutMethod, 'data.email');
    if (!email) {
      set(errors, 'data.email', createError(ERROR.FORM_FIELD_REQUIRED));
    } else if (!isEmail(email)) {
      set(errors, 'data.email', createError(ERROR.FORM_FIELD_PATTERN));
    }
  } else if (payoutMethod.type === PayoutMethodType.BANK_ACCOUNT) {
    if (!payoutMethod.data?.currency) {
      set(errors, 'data.currency', createError(ERROR.FORM_FIELD_REQUIRED));
    }
    if (!payoutMethod.data?.accountHolderName) {
      set(errors, 'data.accountHolderName', createError(ERROR.FORM_FIELD_REQUIRED));
    }
  } else if (payoutMethod.type === PayoutMethodType.OTHER) {
    const content = get(payoutMethod, 'data.content');
    if (!content) {
      set(errors, 'data.content', createError(ERROR.FORM_FIELD_MIN_LENGTH));
    }
  }

  return errors;
};

/**
 * A form to fill infos for a new payout method or to edit an existing one.
 * This component is **fully controlled**, you need to call `validatePayoutMethod`
 * to proceed with the validation and pass the result with the `errors` prop.
 */
const PayoutMethodForm = ({ payoutMethod, fieldsPrefix, host, required, alwaysSave = false }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const isNew = !payoutMethod.id;

  const getFieldName = field => compact([fieldsPrefix, field]).join('.');

  return (
    <Box>
      {payoutMethod.type === PayoutMethodType.PAYPAL && (
        <Field name={getFieldName('data.email')}>
          {({ field, meta }) => (
            <StyledInputField
              name={field.name}
              type="email"
              error={formatFormErrorMessage(intl, meta.error)}
              label={formatMessage(msg.paypalEmail)}
              labelFontSize="13px"
              disabled={!isNew}
              required={required !== false}
            >
              {inputProps => <StyledInput placeholder="e.g., yourname@yourhost.com" {...inputProps} {...field} />}
            </StyledInputField>
          )}
        </Field>
      )}
      {payoutMethod.type === PayoutMethodType.OTHER && (
        <Field name={getFieldName('data.content')}>
          {({ field, meta }) => (
            <StyledInputField
              name={field.name}
              error={formatFormErrorMessage(intl, meta.error)}
              label={formatMessage(msg.content)}
              labelFontSize="13px"
              disabled={!isNew}
              data-cy="payout-other-info"
              required={required !== false}
            >
              {inputProps => <StyledTextarea minHeight={100} {...inputProps} {...field} />}
            </StyledInputField>
          )}
        </Field>
      )}
      {payoutMethod.type === PayoutMethodType.BANK_ACCOUNT && (
        <PayoutBankInformationForm
          isNew={isNew}
          getFieldName={getFieldName}
          host={host}
          optional={required === false}
        />
      )}
      {isNew && !alwaysSave && (
        <Box mt={3}>
          <Field name={getFieldName('isSaved')}>
            {({ field }) => (
              <StyledCheckbox label={formatMessage(msg.savePayout)} fontSize="13px" checked={field.value} {...field} />
            )}
          </Field>
        </Box>
      )}
    </Box>
  );
};

PayoutMethodForm.propTypes = {
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }),
  /** Set this to nil to create a new one */
  payoutMethod: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    type: PropTypes.oneOf(Object.values(PayoutMethodType)).isRequired,
    data: PropTypes.object,
  }).isRequired,
  /** Base name of the field in the form */
  fieldsPrefix: PropTypes.string,
  required: PropTypes.bool,
  alwaysSave: PropTypes.bool,
};

export default React.memo(PayoutMethodForm);

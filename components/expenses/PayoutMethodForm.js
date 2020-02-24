import { Box } from '@rebass/grid';
import { Field } from 'formik';
import { get, set } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { isEmail } from 'validator';

import { PayoutMethodType } from '../../lib/constants/payout-method';
import { createError, formatErrorMessage, FORM_ERROR } from '../../lib/form-utils';
import StyledCheckbox from '../StyledCheckbox';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledTextarea from '../StyledTextarea';

import PayoutBankInformationForm from './PayoutBankInformationForm';

const msg = defineMessages({
  email: {
    id: 'Email',
    defaultMessage: 'Email',
  },
  content: {
    id: 'PayoutMethod.Other.content',
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

  if (payoutMethod.type === PayoutMethodType.PAYPAL) {
    const email = get(payoutMethod, 'data.email');
    if (!email) {
      set(errors, 'data.email', createError(FORM_ERROR.REQUIRED));
    } else if (!isEmail(email)) {
      set(errors, 'data.email', createError(FORM_ERROR.PATTERN));
    }
  } else if (payoutMethod.type === PayoutMethodType.BANK_ACCOUNT) {
    if (!payoutMethod.data.currency) {
      set(errors, 'data.currency', createError(FORM_ERROR.REQUIRED));
    }
    if (!payoutMethod.data.accountHolderName) {
      set(errors, 'data.accountHolderName', createError(FORM_ERROR.REQUIRED));
    }
  } else if (payoutMethod.type === PayoutMethodType.OTHER) {
    const content = get(payoutMethod, 'data.content');
    if (!content) {
      set(errors, 'data.content', createError(FORM_ERROR.MIN_LENGTH));
    }
  }

  return errors;
};

/**
 * A form to fill infos for a new payout method or to edit an existing one.
 * This component is **fully controlled**, you need to call `validatePayoutMethod`
 * to proceed with the validation and pass the result with the `errors` prop.
 */
const PayoutMethodForm = ({ payoutMethod, fieldsPrefix, collective }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const isNew = !payoutMethod.id;

  const fixedPrefix = fieldsPrefix ? `${fieldsPrefix}.` : '';
  const getFieldName = field => `${fixedPrefix}${field}`;

  return (
    <Box>
      {payoutMethod.type === PayoutMethodType.PAYPAL && (
        <Field name={getFieldName('data.email')}>
          {({ field, meta }) => (
            <StyledInputField
              name={field.name}
              type="email"
              error={formatErrorMessage(intl, meta.error)}
              label={formatMessage(msg.email)}
              disabled={!isNew}
              required
            >
              {inputProps => <StyledInput placeholder="i.e. yourname@yourhost.com" {...inputProps} {...field} />}
            </StyledInputField>
          )}
        </Field>
      )}
      {payoutMethod.type === PayoutMethodType.OTHER && (
        <Field name={getFieldName('data.content')}>
          {({ field, meta }) => (
            <StyledInputField
              name={field.name}
              type="email"
              error={formatErrorMessage(intl, meta.error)}
              label={formatMessage(msg.content)}
              disabled={!isNew}
              required
            >
              {inputProps => <StyledTextarea minHeight={100} {...inputProps} {...field} />}
            </StyledInputField>
          )}
        </Field>
      )}
      {payoutMethod.type === PayoutMethodType.BANK_ACCOUNT && (
        <PayoutBankInformationForm
          payoutMethod={payoutMethod}
          isNew={isNew}
          getFieldName={getFieldName}
          collective={collective}
        />
      )}
      {isNew && (
        <Box mt={3}>
          <Field name={getFieldName('isSaved')}>
            {({ field }) => <StyledCheckbox label={formatMessage(msg.savePayout)} checked={field.value} {...field} />}
          </Field>
        </Box>
      )}
    </Box>
  );
};

PayoutMethodForm.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    host: PropTypes.shape({
      transferwise: PropTypes.shape({
        availableCurrencies: PropTypes.arrayOf(PropTypes.string),
      }),
    }),
  }).isRequired,
  /** Set this to nil to create a new one */
  payoutMethod: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    type: PropTypes.oneOf(Object.values(PayoutMethodType)).isRequired,
    data: PropTypes.object,
  }).isRequired,
  /** Base name of the field in the form */
  fieldsPrefix: PropTypes.string,
};

export default React.memo(PayoutMethodForm);

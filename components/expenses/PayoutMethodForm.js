import React from 'react';
import { Field, useFormikContext } from 'formik';
import { compact, get, set } from 'lodash';
import { BadgeCheck, ShieldAlert } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { isEmail } from 'validator';

import { PayPalSupportedCurrencies } from '../../lib/constants/currency';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { createError, ERROR } from '../../lib/errors';

import CurrencyPicker from '../CurrencyPicker';
import { FormField } from '../FormField';
import PaypalConnectButton from '../paypal/PaypalConnectButton';
import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';
import { Textarea } from '../ui/Textarea';
import { useToast } from '../ui/useToast';

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
  currency: {
    id: 'Currency',
    defaultMessage: 'Currency',
  },
});

/**
 * Use this function to validate the payout method.
 * Pass `isPaypalConnectEnabled: true` when the platform has PayPal Connect configured —
 * in that case a `connectedAccountId` is required instead of a manually typed email.
 */
export const validatePayoutMethod = (payoutMethod, { isPaypalConnectEnabled = false } = {}) => {
  const errors = {};

  if (!payoutMethod || !payoutMethod.type) {
    set(errors, 'type', createError(ERROR.FORM_FIELD_REQUIRED));
  } else if (payoutMethod.type === PayoutMethodType.PAYPAL) {
    if (isPaypalConnectEnabled) {
      // Require a connected account when PayPal Connect is configured
      if (!get(payoutMethod, 'data.connectedAccountId')) {
        set(errors, 'data.connectedAccountId', createError(ERROR.FORM_FIELD_REQUIRED));
      }
      // Email is set automatically by onSuccess; still validate its format if present
      const email = get(payoutMethod, 'data.email');
      if (email && !isEmail(email)) {
        set(errors, 'data.email', createError(ERROR.FORM_FIELD_PATTERN));
      }
    } else {
      const email = get(payoutMethod, 'data.email');
      if (!email) {
        set(errors, 'data.email', createError(ERROR.FORM_FIELD_REQUIRED));
      } else if (!isEmail(email)) {
        set(errors, 'data.email', createError(ERROR.FORM_FIELD_PATTERN));
      }
    }
  } else if (payoutMethod.type === PayoutMethodType.BANK_ACCOUNT) {
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
const PayoutMethodForm = ({
  payoutMethod,
  fieldsPrefix,
  host,
  required,
  alwaysSave = false,
  disabled = false,
  /** The collective ID of the payee — needed to start the PayPal OAuth flow */
  payeeLegacyCollectiveId = null,
  /** When true, the PayPal Connect SDK button is shown and the manual email field is hidden */
  isPaypalConnectEnabled = false,
}) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const isNew = !payoutMethod.id;
  const form = useFormikContext();
  const { toast } = useToast();
  const getFieldName = React.useCallback(field => compact([fieldsPrefix, field]).join('.'), [fieldsPrefix]);
  const currencyFieldName = getFieldName('data.currency');

  const { setFieldValue } = form;
  const onCurrencyPickerChange = React.useCallback(
    currency => {
      setFieldValue(currencyFieldName, currency);
    },
    [currencyFieldName, setFieldValue],
  );

  const onPaypalConnectSuccess = React.useCallback(
    ({ connectedAccountId, email }) => {
      setFieldValue(getFieldName('data.email'), email);
      setFieldValue(getFieldName('data.connectedAccountId'), connectedAccountId);
      toast({
        variant: 'success',
        message: (
          <FormattedMessage defaultMessage="Your PayPal account has been connected." id="PayPal.ConnectSuccess" />
        ),
      });
    },
    [getFieldName, setFieldValue, toast],
  );

  const onPaypalConnectError = React.useCallback(
    err => {
      toast({ variant: 'error', message: i18nGraphqlException(intl, err) });
    },
    [intl, toast],
  );

  const isPaypalVerified = Boolean(payoutMethod.isVerified);
  const paypalInfo = payoutMethod.paypalInfo;

  return (
    <div className="space-y-3">
      {payoutMethod.type === PayoutMethodType.PAYPAL && (
        <React.Fragment>
          <FormField name={currencyFieldName} disabled={disabled} label={formatMessage(msg.currency)}>
            {({ field }) => (
              <CurrencyPicker
                availableCurrencies={PayPalSupportedCurrencies}
                disabled={disabled}
                inputId={field.id}
                name={field.name}
                onChange={onCurrencyPickerChange}
                value={field.value}
              />
            )}
          </FormField>

          {/* Verification status for existing PayPal payout methods */}
          {!isNew && (
            <div className="flex items-center gap-2">
              {isPaypalVerified ? (
                <Badge type="success" className="flex items-center gap-1 text-xs">
                  <BadgeCheck size={12} />
                  <FormattedMessage defaultMessage="PayPal account verified" id="PayPal.Verified" />
                  {paypalInfo?.verifiedAt && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({new Date(paypalInfo.verifiedAt).toLocaleDateString()})
                    </span>
                  )}
                </Badge>
              ) : (
                <Badge type="warning" className="flex items-center gap-1 text-xs">
                  <ShieldAlert size={12} />
                  <FormattedMessage defaultMessage="PayPal account not verified" id="PayPal.NotVerified" />
                </Badge>
              )}
              {/* Re-connect button for existing methods (when PayPal Connect is enabled) */}
              {isPaypalConnectEnabled && payeeLegacyCollectiveId && (
                <PaypalConnectButton
                  collectiveId={payeeLegacyCollectiveId}
                  onSuccess={onPaypalConnectSuccess}
                  onError={onPaypalConnectError}
                  currency={get(payoutMethod, 'data.currency')}
                  alias={get(payoutMethod, 'name')}
                  disabled={disabled || !get(payoutMethod, 'data.currency')}
                />
              )}
            </div>
          )}

          {/* Email field: hidden when PayPal Connect is enabled for new methods */}
          {(!isPaypalConnectEnabled || !isNew) && (
            <FormField
              type="email"
              name={getFieldName('data.email')}
              label={formatMessage(msg.paypalEmail)}
              disabled={!isNew || disabled}
              required={required !== false}
              placeholder="e.g., yourname@yourhost.com"
            />
          )}
          {alwaysSave && (
            <FormField
              disabled={disabled}
              name={getFieldName('name')}
              label={intl.formatMessage({ defaultMessage: 'Alias', id: 'PayoutMethod.New.Alias' })}
              hint={intl.formatMessage({
                defaultMessage: 'Give this payout method an alias that will help you identify it',
                id: 'PayoutMethod.New.Alias.hint',
              })}
              placeholder={intl.formatMessage({
                defaultMessage: 'e.g., PayPal Personal',
                id: 'PayoutMethod.New.Alias.placeholder.paypal',
              })}
              required={false}
            />
          )}
        </React.Fragment>
      )}
      {payoutMethod.type === PayoutMethodType.OTHER && (
        <React.Fragment>
          <FormField name={currencyFieldName} disabled={disabled} label={formatMessage(msg.currency)}>
            {({ field }) => (
              <CurrencyPicker
                inputId={field.id}
                disabled={disabled}
                name={field.name}
                onChange={onCurrencyPickerChange}
                value={field.value}
              />
            )}
          </FormField>
          <FormField disabled={disabled} name={getFieldName('data.content')} label={formatMessage(msg.content)}>
            {({ field }) => <Textarea {...field} minHeight={100} disabled={!isNew} data-cy="payout-other-info" />}
          </FormField>
          {alwaysSave && (
            <FormField
              disabled={disabled}
              name={getFieldName('name')}
              label={intl.formatMessage({ defaultMessage: 'Alias', id: 'PayoutMethod.New.Alias' })}
              hint={intl.formatMessage({
                defaultMessage: 'Give this payout method an alias that will help you identify it',
                id: 'PayoutMethod.New.Alias.hint',
              })}
              placeholder={intl.formatMessage({
                defaultMessage: 'e.g., Main Bank Account',
                id: 'PayoutMethod.New.Alias.placeholder.bankAccount',
              })}
              required={false}
            />
          )}
        </React.Fragment>
      )}
      {payoutMethod.type === PayoutMethodType.BANK_ACCOUNT && (
        <PayoutBankInformationForm
          disabled={disabled}
          isNew={isNew}
          getFieldName={getFieldName}
          host={host}
          optional={required === false}
          alwaysSave={alwaysSave}
        />
      )}
      {isNew && !alwaysSave && (
        <div className="mt-4">
          <Field name={getFieldName('isSaved')}>
            {({ field, form }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  {...field}
                  disabled={disabled}
                  id={field.name}
                  checked={field.value}
                  onCheckedChange={val => form.setFieldValue(field.name, val)}
                />
                <label
                  htmlFor={field.name}
                  className="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {formatMessage(msg.savePayout)}
                </label>
              </div>
            )}
          </Field>
        </div>
      )}
    </div>
  );
};

export default React.memo(PayoutMethodForm);

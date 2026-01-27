import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { getEmojiByCountryCode } from 'country-currency-emoji-flags';
import { useFormikContext } from 'formik';
import { compact, get, kebabCase, partition } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';
import { createError, ERROR } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';
import { gql } from '../../lib/graphql/helpers';

import { ComboSelect } from '../ComboSelect';
import CurrencyPicker from '../CurrencyPicker';
import { FormField } from '../FormField';
import { I18nSupportLink } from '../I18nFormatters';
import { InfoTooltipIcon } from '../InfoTooltipIcon';
import MessageBox from '../MessageBox';
import { Input } from '../ui/Input';
import { Separator } from '../ui/Separator';
import { Skeleton } from '../ui/Skeleton';

const formatStringOptions = strings => strings.map(s => ({ label: s, value: s }));
const formatTransferWiseSelectOptions = (fieldName, values) => {
  const lastPart = fieldName.split('.').pop();
  if (lastPart === 'country') {
    return values.map(({ key, name }) => ({ value: key, label: `${getEmojiByCountryCode(key)} ${name}` }));
  }

  return values.map(({ key, name }) => ({ value: key, label: name }));
};

const WISE_PLATFORM_COLLECTIVE_SLUG = process.env.WISE_PLATFORM_COLLECTIVE_SLUG || process.env.TW_API_COLLECTIVE_SLUG;

const msg = defineMessages({
  fieldRequired: {
    id: 'FieldRequired',
    defaultMessage: '{name} is required.',
  },
});

const requiredFieldsQuery = gql`
  query PayoutBankInformationRequiredFields($slug: String, $currency: String!, $accountDetails: JSON) {
    host(slug: $slug) {
      id
      transferwise {
        id
        requiredFields(currency: $currency, accountDetails: $accountDetails) {
          type
          title
          fields {
            name
            group {
              key
              name
              type
              required
              example
              minLength
              maxLength
              validationRegexp
              refreshRequirementsOnChange
              valuesAllowed {
                key
                name
              }
            }
          }
        }
      }
    }
  }
`;

const validateRequiredInput = (intl, input, required) =>
  required ? value => (value ? undefined : intl.formatMessage(msg.fieldRequired, { name: input.name })) : undefined;

const i18nFieldLabels = defineMessages({
  'Recipient type': {
    id: 'PayoutBankInformationForm.Field.RecipientType',
    defaultMessage: 'Recipient type',
  },
  'Email (Optional)': {
    id: 'tkkyjR',
    defaultMessage: 'Email (Optional)',
  },
  'Full name of the account holder': {
    id: 'PayoutBankInformationForm.Field.AccountHolderName',
    defaultMessage: 'Full name of the account holder',
  },
  'Bank code (BIC/SWIFT)': {
    id: 'PayoutBankInformationForm.Field.BankCode',
    defaultMessage: 'Bank code (BIC/SWIFT)',
  },
  Country: {
    id: 'collective.country.label',
    defaultMessage: 'Country',
  },
  City: {
    id: 'TE4fIS',
    defaultMessage: 'City',
  },
  'Recipient address': {
    id: '524K2a',
    defaultMessage: 'Recipient address',
  },
  'Post code': {
    id: '8BeclW',
    defaultMessage: 'Post code',
  },
});

const Field = ({
  input,
  getFieldName,
  disabled,
  loading,
  refetch,
  formik,
  labelClassName,
  hintClassName,
  errorClassName,
  fieldClassName,
}) => {
  const intl = useIntl();
  const isAccountHolderName = input.key === 'accountHolderName';
  const fieldName = isAccountHolderName ? getFieldName(input.key) : getFieldName(`details.${input.key}`);
  const required = disabled ? false : input.required;
  const label = i18nFieldLabels[input.name] ? intl.formatMessage(i18nFieldLabels[input.name]) : input.name;
  const comboOptions = React.useMemo(
    () =>
      input.type === 'radio' || input.type === 'select'
        ? formatTransferWiseSelectOptions(fieldName, input.valuesAllowed || [])
        : [],
    [input.type, input.valuesAllowed],
  );

  const { setFieldValue } = formik;
  const comboOnChange = React.useCallback(
    value => {
      setFieldValue(fieldName, value);
      if (input.refreshRequirementsOnChange && refetch) {
        refetch();
      }
    },
    [fieldName, input.refreshRequirementsOnChange, refetch, setFieldValue],
  );

  let validate = validateRequiredInput(intl, input, required);
  if (input.type === 'text') {
    if (input.validationRegexp || input.minLength || input.maxLength) {
      validate = value => {
        if (!value && required) {
          return formatFormErrorMessage(intl, createError(ERROR.FORM_FIELD_REQUIRED));
        }
        if (input.validationRegexp) {
          const matches = new RegExp(input.validationRegexp).test(value);
          if (!matches && value) {
            return input.validationError || formatFormErrorMessage(intl, createError(ERROR.FORM_FIELD_PATTERN));
          }
        }
        if (value && input.minLength && value.length < input.minLength) {
          return input.validationError || formatFormErrorMessage(intl, createError(ERROR.FORM_FIELD_MIN_LENGTH));
        }
        if (value && input.maxLength && value.length > input.maxLength) {
          return input.validationError || formatFormErrorMessage(intl, createError(ERROR.FORM_FIELD_MAX_LENGTH));
        }
      };
    }
    return (
      <div className={fieldClassName || 'mt-2 flex-1'} key={input.key}>
        <FormField
          disabled={disabled}
          name={fieldName}
          label={label}
          placeholder={input.example}
          hint={input.hint}
          max={input.maxLength}
          min={input.minLength}
          validate={validate}
          labelClassName={labelClassName}
          hintClassName={hintClassName}
          errorClassName={errorClassName}
        />
      </div>
    );
  } else if (input.type === 'date') {
    return (
      <div className={fieldClassName || 'mt-2 flex-1'} key={input.key}>
        <FormField
          label={label}
          name={fieldName}
          hint={input.hint}
          required={required}
          disabled={disabled}
          validate={validate}
          labelClassName={labelClassName}
          hintClassName={hintClassName}
          errorClassName={errorClassName}
        >
          {({ field }) => <Input type="date" {...field} value={get(formik.values, field.name) || ''} />}
        </FormField>
      </div>
    );
  } else if (input.type === 'radio' || input.type === 'select') {
    return (
      <div className={fieldClassName || 'mt-2 flex-1'}>
        <FormField
          disabled={disabled}
          name={fieldName}
          label={label}
          hint={input.hint}
          required={required}
          validate={validate}
          labelClassName={labelClassName}
          hintClassName={hintClassName}
          errorClassName={errorClassName}
        >
          {({ field }) => (
            <ComboSelect
              {...field}
              inputId={field.name}
              disabled={disabled}
              error={field.error}
              onChange={comboOnChange}
              options={comboOptions}
              value={get(formik.values, field.name)}
              loading={loading && !comboOptions.length}
            />
          )}
        </FormField>
      </div>
    );
  } else {
    return null;
  }
};

export const FieldGroup = ({ field, labelClassName, hintClassName, errorClassName, fieldClassName, ...props }) => {
  return (
    <div className="flex-1">
      {field.group.map(input => (
        <Field
          key={input.key}
          input={input}
          labelClassName={labelClassName}
          hintClassName={hintClassName}
          errorClassName={errorClassName}
          fieldClassName={fieldClassName}
          {...props}
        />
      ))}
    </div>
  );
};

const i18nTransactionTypeLabels = defineMessages({
  'Inside Europe': {
    id: 'PayoutBankInformationForm.TransactionType.InsideEurope',
    defaultMessage: 'Inside Europe',
  },
  'Outside Europe': {
    id: 'PayoutBankInformationForm.TransactionType.OutsideEurope',
    defaultMessage: 'Outside Europe',
  },
  'Local bank account': {
    id: 'PayoutBankInformationForm.TransactionType.LocalBankAccount',
    defaultMessage: 'Local bank account',
  },
  ACH: {
    defaultMessage: 'In the US (ACH)',
    id: 'PayoutBankInformationForm.TransactionType.ABA',
  },
  Wire: {
    defaultMessage: 'In the US (Wire)',
    id: 'PayoutBankInformationForm.TransactionType.Wire',
  },
  SWIFT: {
    defaultMessage: 'Outside the US',
    id: 'PayoutBankInformationForm.TransactionType.SwiftCode',
  },
  // TODO: Figure out the "Wire" option
});

const DetailsForm = ({
  disabled,
  getFieldName,
  onlyDataFields,
  formik,
  host,
  currency,
  alwaysSave,
  sectionHeaderClassName,
  labelClassName,
  hintClassName,
  errorClassName,
  fieldClassName,
}) => {
  const intl = useIntl();
  const needsRefetchRef = React.useRef(false);
  const { loading, error, data, refetch } = useQuery(requiredFieldsQuery, {
    // A) If `fixedCurrency` was passed in PayoutBankInformationForm (2) (3)
    //    then `host` is not set and we'll use the Platform Wise account
    // B) If `host` is set, we expect to be in 2 cases:
    //      * The Collective Host has Wise configured and we should be able to fetch `requiredFields` from it
    //      * The Collective Host doesn't have Wise configured and `host` is already switched to the Platform account
    variables: { slug: host ? host.slug : WISE_PLATFORM_COLLECTIVE_SLUG, currency },
  });

  const doRefetchOnChange = React.useCallback(() => {
    needsRefetchRef.current = true;
  }, []);

  const accountDetails = get(formik.values, getFieldName('data'));
  React.useEffect(() => {
    if (needsRefetchRef.current) {
      needsRefetchRef.current = false;
      refetch({
        slug: host ? host.slug : WISE_PLATFORM_COLLECTIVE_SLUG,
        currency,
        accountDetails: accountDetails,
      });
    }
  }, [currency, accountDetails, host, refetch]);

  // Make sure we load the form data on initial load. Otherwise certain form fields such
  // as the state field in the "Recipient's Address" section might not be visible on first load
  // and only be visible after the user reselect the country.
  useEffect(() => {
    refetch({ accountDetails: get(formik.values, getFieldName('data')) });
  }, []);

  const transactionTypeValues = React.useMemo(
    () =>
      (data?.host?.transferwise?.requiredFields ?? []).map(rf => ({
        label: i18nTransactionTypeLabels[rf.title] ? intl.formatMessage(i18nTransactionTypeLabels[rf.title]) : rf.title,
        value: rf.type,
      })),
    [data?.host?.transferwise?.requiredFields, intl],
  );

  const transactionMethodFieldName = getFieldName('data.type');
  const dataFieldName = getFieldName(`data`);

  const { setFieldValue } = formik;
  const { type, currency: formCurrencyValue } = get(formik.values, dataFieldName);
  const onComboChange = React.useCallback(
    value => {
      setFieldValue(dataFieldName, { type, currency: formCurrencyValue });
      setFieldValue(transactionMethodFieldName, value);
    },
    [dataFieldName, setFieldValue, transactionMethodFieldName, type, formCurrencyValue],
  );

  if (loading && !data) {
    return <Skeleton className="mt-2 h-10 w-full" />;
  }
  if (error) {
    return (
      <MessageBox mt={2} fontSize="12px" type="error">
        <FormattedMessage
          id="PayoutBankInformationForm.Error.RequiredFields"
          defaultMessage="There was an error fetching the required fields"
        />
        {error.message && `: ${error.message}`}
      </MessageBox>
    );
  }

  // If at this point we don't have `requiredFields` available,
  // we can display an error message, Wise is likely not configured on the platform
  if (!data?.host?.transferwise?.requiredFields) {
    if (process.env.OC_ENV === 'development') {
      return (
        <MessageBox mt={2} fontSize="12px" type="warning">
          Could not fetch requiredFields, Wise is likely not configured on the platform.
        </MessageBox>
      );
    } else {
      // eslint-disable-next-line no-console
      console.warn('Could not fetch requiredFields through Wise.');
      return null;
    }
  }

  // Some currencies offer different methods for the transaction
  // e.g., USD allows ABA and SWIFT transactions.
  const availableMethods = data.host.transferwise.requiredFields.find(
    method => method.type === get(formik.values, getFieldName(`data.type`)),
  );
  const [addressFields, otherFields] = partition(availableMethods?.fields, field =>
    field.group.every(g => g.key.includes('address.')),
  );

  const transactionMethod = get(formik.values, transactionMethodFieldName);

  const transactionMethodLabel =
    currency === 'USD'
      ? intl.formatMessage({ defaultMessage: "Where's the recipient bank account located?", id: '+xrUEC' })
      : intl.formatMessage({
          id: 'PayoutBankInformationForm.TransactionMethod',
          defaultMessage: 'Transaction Method',
        });

  return (
    <div className="mt-2 flex flex-col">
      <FormField
        disabled={disabled}
        name={transactionMethodFieldName}
        label={transactionMethodLabel}
        validate={validateRequiredInput(intl, { name: transactionMethodLabel }, !disabled)}
        labelClassName={labelClassName}
        hintClassName={hintClassName}
        errorClassName={errorClassName}
      >
        {({ field }) => {
          return (
            <ComboSelect
              {...field}
              inputId={field.id}
              options={transactionTypeValues}
              onChange={onComboChange}
              value={availableMethods?.type ?? undefined}
            />
          );
        }}
      </FormField>

      {transactionMethod && (
        <React.Fragment>
          <div className="mt-6 flex-1">
            <p className={sectionHeaderClassName || 'text-base font-semibold'}>
              <FormattedMessage id="PayoutBankInformationForm.AccountInfo" defaultMessage="Account Information" />
            </p>
          </div>
          {otherFields.map(field => (
            <FieldGroup
              currency={currency}
              disabled={disabled}
              field={field}
              formik={formik}
              getFieldName={string => getFieldName(compact(['data', string]).join('.'))}
              host={host}
              key={kebabCase(field.name)}
              loading={loading}
              refetch={doRefetchOnChange}
              labelClassName={labelClassName}
              hintClassName={hintClassName}
              errorClassName={errorClassName}
              fieldClassName={fieldClassName}
            />
          ))}
        </React.Fragment>
      )}
      {Boolean(addressFields.length) && (
        <React.Fragment>
          <div className="mt-6 flex flex-1 items-center gap-2">
            <span className={sectionHeaderClassName || 'text-base font-semibold'}>
              <FormattedMessage id="PayoutBankInformationForm.RecipientAddress" defaultMessage="Recipient's Address" />
            </span>
            <InfoTooltipIcon>
              <FormattedMessage
                id="PayoutBankInformationForm.HolderAddress"
                defaultMessage="Bank account holder address (not the bank address)"
              />
            </InfoTooltipIcon>
          </div>

          {addressFields.map(field => (
            <FieldGroup
              currency={currency}
              disabled={disabled}
              field={field}
              formik={formik}
              getFieldName={string => getFieldName(compact(['data', string]).join('.'))}
              host={host}
              key={kebabCase(field.name)}
              loading={loading}
              refetch={doRefetchOnChange}
              labelClassName={labelClassName}
              hintClassName={hintClassName}
              errorClassName={errorClassName}
              fieldClassName={fieldClassName}
            />
          ))}
        </React.Fragment>
      )}
      {transactionMethod && alwaysSave && !onlyDataFields && (
        <React.Fragment>
          <Separator className="my-6" />
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
        </React.Fragment>
      )}
    </div>
  );
};

const availableCurrenciesQuery = gql`
  query PayoutBankInformationAvailableCurrencies($slug: String, $ignoreBlockedCurrencies: Boolean) {
    host(slug: $slug) {
      id
      slug
      currency
      transferwise {
        id
        availableCurrencies(ignoreBlockedCurrencies: $ignoreBlockedCurrencies)
      }
    }
  }
`;

/**
 * Form for payout bank information. Must be used with Formik.
 *
 * The main goal is to use this component in the Expense Flow (1) but it's also reused in:
 *
 * - In Collective/Host settings -> Receiving Money, BankTransfer.js (2)
 *
 * In (1) we pass the host where the expense is submitted and fixedCurrency is never set.
 *   * If Wise is configured on that host, `availableCurrencies` should normally be available.
 *   * If it's not, we'll have to fetch `availableCurrencies` from the Platform Wise account
 *
 * In (2), we never pass an `host` and `fixedCurrency` is sometimes set.
 *   * If `fixedCurrency` is set, we don't need `availableCurrencies`
 *   * If `fixedCurrency` is not set, we'll fetch `availableCurrencies` from the Platform Wise account
 */
const PayoutBankInformationForm = ({
  isNew,
  getFieldName,
  host = null,
  fixedCurrency = false,
  ignoreBlockedCurrencies = false,
  optional,
  disabled = false,
  alwaysSave = false,
  onlyDataFields = false,
  sectionHeaderClassName = null,
  labelClassName = null,
  hintClassName = null,
  errorClassName = null,
  fieldClassName = null,
}) => {
  const { data, loading } = useQuery(availableCurrenciesQuery, {
    variables: { slug: WISE_PLATFORM_COLLECTIVE_SLUG, ignoreBlockedCurrencies },
    // Skip fetching/loading if the currency is fixed (2) (3)
    // Or if availableCurrencies is already available. Expense Flow + Host with Wise configured (1)
    skip: Boolean(fixedCurrency || host?.transferwise?.availableCurrencies),
  });
  const wiseHost = data?.host || host;
  const formik = useFormikContext();
  const { formatMessage } = useIntl();

  const currencyFieldName = getFieldName('data.currency');
  const dataFieldName = getFieldName('data');
  const selectedCurrency = get(formik.values, currencyFieldName);

  const { setFieldValue } = formik;
  const onCurrencyPickerChange = React.useCallback(
    value => {
      setFieldValue(dataFieldName, {});
      setFieldValue(currencyFieldName, value);
    },
    [currencyFieldName, setFieldValue, dataFieldName],
  );

  const currencies = React.useMemo(() => {
    // Fiscal Host with Wise configured (1) OR Platform account as fallback (1) or default (2) (3)
    // NOTE: If `fixedCurrency is set`, `wiseHost` will be null (at least today)
    const availableCurrencies = wiseHost?.transferwise?.availableCurrencies;
    let currencies;
    if (fixedCurrency) {
      currencies = formatStringOptions([fixedCurrency]);
    } else if (availableCurrencies) {
      currencies = formatStringOptions(availableCurrencies.map(c => c.code));
    }

    if (optional) {
      currencies = currencies || [];
      currencies.unshift({ label: 'No selection', value: null });
    }

    return currencies;
  }, [fixedCurrency, optional, wiseHost?.transferwise?.availableCurrencies]);

  const availableCurrencies = React.useMemo(() => (currencies || []).map(c => c.value).filter(Boolean), [currencies]);

  const validateCurrencyMinimumAmount = React.useCallback(() => {
    // Skip if currency is fixed (2) (3)
    // or if `availableCurrencies` is not set (but we're not supposed to be there anyway)
    if (fixedCurrency || !availableCurrencies) {
      return;
    }

    // Only validate minimum amount if the form has items
    if (formik?.values?.items?.length > 0) {
      const invoiceTotalAmount = formik.values.items.reduce(
        (amount, attachment) => amount + (attachment.amountV2?.valueInCents || attachment.amount || 0),
        0,
      );
      const minAmountForSelectedCurrency =
        availableCurrencies.find(c => c.code === selectedCurrency)?.minInvoiceAmount * 100;
      if (invoiceTotalAmount < minAmountForSelectedCurrency) {
        return formatMessage(
          {
            defaultMessage:
              'The minimum amount for transferring to {selectedCurrency} is {minAmountForSelectedCurrency}',
            id: 'AzGwgz',
          },
          {
            selectedCurrency,
            minAmountForSelectedCurrency: formatCurrency(minAmountForSelectedCurrency, wiseHost?.currency),
          },
        );
      }
    }
  }, [availableCurrencies, fixedCurrency, formatMessage, formik.values.items, selectedCurrency, wiseHost?.currency]);

  // Display spinner if loading
  if (loading) {
    return <Skeleton className="mt-2 h-10 w-full" />;
  }

  if (!currencies) {
    // If at this point we don't have `fixedCurrency` or `availableCurrencies`,
    // we can display an error message, Wise is likely not configured on the platform
    return (
      <MessageBox fontSize="12px" type="warning">
        <FormattedMessage
          defaultMessage="An error occurred while preparing the form for bank accounts. Please contact <I18nSupportLink>support</I18nSupportLink>"
          id="fCWfnb"
          values={{ I18nSupportLink }}
        />
      </MessageBox>
    );
  }

  return (
    <React.Fragment>
      <FormField
        name={currencyFieldName}
        label={<FormattedMessage id="PayoutBankInformationForm.Currency" defaultMessage="Bank Account Currency" />}
        disabled={Boolean(fixedCurrency && !optional) || !isNew || disabled}
        validate={validateCurrencyMinimumAmount}
        labelClassName={labelClassName}
        hintClassName={hintClassName}
        errorClassName={errorClassName}
      >
        {({ field }) => {
          return (
            <CurrencyPicker
              {...field}
              inputId={field.id}
              onChange={onCurrencyPickerChange}
              availableCurrencies={availableCurrencies}
            />
          );
        }}
      </FormField>

      {selectedCurrency && (
        <DetailsForm
          currency={selectedCurrency}
          disabled={!isNew || disabled}
          formik={formik}
          getFieldName={getFieldName}
          host={wiseHost}
          alwaysSave={alwaysSave}
          onlyDataFields={onlyDataFields}
          sectionHeaderClassName={sectionHeaderClassName}
          labelClassName={labelClassName}
          hintClassName={hintClassName}
          errorClassName={errorClassName}
          fieldClassName={fieldClassName}
        />
      )}
      {!selectedCurrency && !currencies?.length && (
        <MessageBox fontSize="12px" type="error" mt={2}>
          <FormattedMessage
            id="PayoutBankInformationForm.Error.AvailableCurrencies"
            defaultMessage="There was an error loading available currencies for this host"
          />
          .
        </MessageBox>
      )}
    </React.Fragment>
  );
};

export default PayoutBankInformationForm;

import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { Info } from '@styled-icons/feather/Info';
import { Field, useFormikContext } from 'formik';
import { get, kebabCase, partition, set } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { Box, Flex } from '../Grid';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledSelect from '../StyledSelect';
import StyledSpinner from '../StyledSpinner';
import StyledTooltip from '../StyledTooltip';
import { P } from '../Text';

const formatStringOptions = strings => strings.map(s => ({ label: s, value: s }));
const formatTransferWiseSelectOptions = values => values.map(({ key, name }) => ({ label: name, value: key }));

export const msg = defineMessages({
  currency: {
    id: 'Currency',
    defaultMessage: 'Currency',
  },
});

const accountHolderFieldOptions = {
  name: 'Account Holder Name',
  group: [
    {
      required: true,
      key: 'accountHolderName',
      name: 'Account Holder Name',
      type: 'text',
      example: 'Jane Doe',
      validationRegexp: '^[^!@#$%&*+]+$',
      validationError: 'Special characters are not allowed. (!@#$%&*+)',
    },
  ],
};

const requiredFieldsQuery = gqlV2/* GraphQL */ `
  query PayoutBankInformationRequiredFields($slug: String, $currency: String!, $accountDetails: JSON) {
    host(slug: $slug) {
      transferwise {
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

const Input = props => {
  const { input, getFieldName, disabled, currency, loading, refetch, formik, host } = props;
  const fieldName =
    input.key === 'accountHolderName' ? getFieldName(`data.${input.key}`) : getFieldName(`data.details.${input.key}`);
  let validate = input.required ? value => (value ? undefined : `${input.name} is required`) : undefined;
  if (input.type === 'text') {
    if (input.validationRegexp) {
      validate = value => {
        const matches = new RegExp(input.validationRegexp).test(value);
        if (!value && input.required) {
          return `${input.name} is required`;
        } else if (!matches && value) {
          return input.validationError || `Invalid ${input.name}`;
        }
      };
    }
    return (
      <Box key={input.key} mt={2} flex="1">
        <Field name={fieldName} validate={validate}>
          {({ field, meta }) => (
            <StyledInputField
              label={input.name}
              labelFontSize="13px"
              required={input.required}
              error={(meta.touched || disabled) && meta.error}
            >
              {() => (
                <StyledInput
                  {...field}
                  placeholder={input.example}
                  error={(meta.touched || disabled) && meta.error}
                  disabled={disabled}
                  width="100%"
                  value={get(formik.values, field.name) || ''}
                />
              )}
            </StyledInputField>
          )}
        </Field>
      </Box>
    );
  } else if (input.type === 'radio' || input.type === 'select') {
    const options = formatTransferWiseSelectOptions(input.valuesAllowed || []);
    return (
      <Box mt={2} flex="1">
        <Field name={fieldName} validate={validate}>
          {({ field, meta }) => (
            <StyledInputField
              label={input.name}
              labelFontSize="13px"
              required={input.required}
              error={(meta.touched || disabled) && meta.error}
            >
              {() => (
                <StyledSelect
                  disabled={disabled}
                  error={(meta.touched || disabled) && meta.error}
                  isLoading={loading && !options.length}
                  name={field.name}
                  options={options}
                  value={options.find(c => c.value === get(formik.values, field.name)) || null}
                  onChange={({ value }) => {
                    formik.setFieldValue(field.name, value);
                    if (input.refreshRequirementsOnChange) {
                      refetch({
                        slug: host.slug,
                        currency,
                        accountDetails: get(set({ ...formik.values }, field.name, value), getFieldName('data')),
                      });
                    }
                  }}
                />
              )}
            </StyledInputField>
          )}
        </Field>
      </Box>
    );
  } else {
    return null;
  }
};

Input.propTypes = {
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }).isRequired,
  currency: PropTypes.string.isRequired,
  formik: PropTypes.object.isRequired,
  getFieldName: PropTypes.func.isRequired,
  refetch: PropTypes.func.isRequired,
  input: PropTypes.object.isRequired,
};

const FieldGroup = ({ field, ...props }) => {
  return (
    <Box flex="1">
      {field.group.map(input => (
        <Input key={input.key} input={input} {...props} />
      ))}
    </Box>
  );
};

FieldGroup.propTypes = {
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }).isRequired,
  currency: PropTypes.string.isRequired,
  formik: PropTypes.object.isRequired,
  getFieldName: PropTypes.func.isRequired,
  refetch: PropTypes.func.isRequired,
  field: PropTypes.object.isRequired,
};

const DetailsForm = ({ disabled, getFieldName, formik, host, currency }) => {
  const { loading, error, data, refetch } = useQuery(requiredFieldsQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: host.slug, currency },
  });
  React.useEffect(() => {
    const type = get(data, 'host.transferwise.requiredFields[0].type');
    if (type) {
      formik.setFieldValue(getFieldName('data.type'), type);
    }
    // Having this effect bein triggered on updates in formik and getFieldName
    // would result in infinite re-rendering.
    // This is also not necessary since these props are required.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading && !data) {
    return <StyledSpinner />;
  }
  if (error) {
    return <P>{error.message}</P>;
  }

  const [requiredFields] = data.host.transferwise.requiredFields;
  const [addressFields, otherFields] = partition(requiredFields.fields, f =>
    f.group.every(g => g.key.includes('address.')),
  );

  return (
    <Flex flexDirection="column">
      <Box mt={2} flex="1">
        <P fontSize="16px" fontWeight="bold">
          {requiredFields.title}
        </P>
      </Box>
      <Box mt={3} flex="1">
        <P fontSize="14px" fontWeight="bold">
          Account Information
        </P>
      </Box>
      {
        // Displays the account holder field only if the other fields are also loaded
        Boolean(requiredFields.fields.length) && (
          <FieldGroup
            currency={currency}
            disabled={disabled}
            field={accountHolderFieldOptions}
            formik={formik}
            getFieldName={getFieldName}
            host={host}
            key={kebabCase(accountHolderFieldOptions.name)}
            refetch={refetch}
          />
        )
      }
      {otherFields.map(field => (
        <FieldGroup
          currency={currency}
          disabled={disabled}
          field={field}
          formik={formik}
          getFieldName={getFieldName}
          host={host}
          key={kebabCase(field.name)}
          loading={loading}
          refetch={refetch}
        />
      ))}
      <Box mt={3} flex="1" fontSize="14px" fontWeight="bold">
        Recipient&apos;s Address&nbsp;
        <StyledTooltip content="Address of the owner of the bank account (not the address of the bank)">
          <Info size={16} />
        </StyledTooltip>
      </Box>
      {addressFields.map(field => (
        <FieldGroup
          currency={currency}
          disabled={disabled}
          field={field}
          formik={formik}
          getFieldName={getFieldName}
          host={host}
          key={kebabCase(field.name)}
          loading={loading}
          refetch={refetch}
        />
      ))}
    </Flex>
  );
};

DetailsForm.propTypes = {
  disabled: PropTypes.bool,
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }).isRequired,
  currency: PropTypes.string.isRequired,
  formik: PropTypes.object.isRequired,
  getFieldName: PropTypes.func.isRequired,
};

const availableCurrenciesQuery = gqlV2/* GraphQL */ `
  query PayoutBankInformationAvailableCurrencies($slug: String, $ignoreBlockedCurrencies: Boolean) {
    host(slug: $slug) {
      slug
      currency
      transferwise {
        availableCurrencies(ignoreBlockedCurrencies: $ignoreBlockedCurrencies)
      }
    }
  }
`;

/**
 * Form for payout bank information. Must be used with Formik.
 */
const PayoutBankInformationForm = ({ isNew, getFieldName, host, fixedCurrency, ignoreBlockedCurrencies, optional }) => {
  const { data, loading } = useQuery(availableCurrenciesQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: host.slug, ignoreBlockedCurrencies },
    // Skip fetching/loading if the currency is fixed or avaialbleCurrencies was pre-loaded
    skip: Boolean(fixedCurrency || host.transferwise?.availableCurrencies),
  });
  const formik = useFormikContext();
  const { formatMessage } = useIntl();
  host = data?.host || host;

  // Display spinner if loading
  if (loading) {
    return <StyledSpinner />;
  } else if (!host.transferwise?.availableCurrencies && !fixedCurrency) {
    return null;
  }

  const availableCurrencies = host.transferwise?.availableCurrencies || data?.host?.transferwise?.availableCurrencies;
  const currencies = formatStringOptions(fixedCurrency ? [fixedCurrency] : availableCurrencies.map(c => c.code));
  if (optional) {
    currencies.unshift({ label: 'No selection', value: null });
  }
  const currencyFieldName = getFieldName('data.currency');
  const selectedCurrency = fixedCurrency || get(formik.values, currencyFieldName);
  const validateCurrencyMinimumAmount = () => {
    // Only validate minimum amount if the form has items
    if (formik?.values?.items?.length > 0) {
      const invoiceTotalAmount = formik.values.items.reduce(
        (amount, attachment) => amount + (attachment.amount || 0),
        0,
      );
      const minAmountForSelectedCurrency =
        availableCurrencies.find(c => c.code === selectedCurrency)?.minInvoiceAmount * 100;
      if (invoiceTotalAmount < minAmountForSelectedCurrency) {
        return `The minimum amount for transfering to ${selectedCurrency} is ${formatCurrency(
          minAmountForSelectedCurrency,
          host.currency,
        )}`;
      }
    }
  };

  return (
    <React.Fragment>
      <Field name={currencyFieldName} validate={validateCurrencyMinimumAmount}>
        {({ field }) => (
          <StyledInputField name={field.name} label={formatMessage(msg.currency)} labelFontSize="13px" mt={3} mb={2}>
            {({ id }) => (
              <StyledSelect
                inputId={id}
                name={field.name}
                onChange={({ value }) => {
                  formik.setFieldValue(getFieldName('data'), {});
                  formik.setFieldValue(field.name, value);
                }}
                options={currencies}
                value={currencies.find(c => c.label === selectedCurrency) || null}
                disabled={Boolean(fixedCurrency) || !isNew}
              />
            )}
          </StyledInputField>
        )}
      </Field>
      {selectedCurrency && (
        <DetailsForm
          currency={selectedCurrency}
          disabled={!isNew}
          formik={formik}
          getFieldName={getFieldName}
          host={host}
        />
      )}
    </React.Fragment>
  );
};

PayoutBankInformationForm.propTypes = {
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string,
    transferwise: PropTypes.shape({
      availableCurrencies: PropTypes.arrayOf(PropTypes.object),
    }),
  }).isRequired,
  isNew: PropTypes.bool,
  optional: PropTypes.bool,
  ignoreBlockedCurrencies: PropTypes.bool,
  getFieldName: PropTypes.func.isRequired,
  /** Enforces a fixedCurrency */
  fixedCurrency: PropTypes.string,
  /** A map of errors for this object */
  errors: PropTypes.object,
};

export default PayoutBankInformationForm;

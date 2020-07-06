import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/react-hooks';
import { Field, useFormikContext } from 'formik';
import { get, kebabCase, set } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { formatFormErrorMessage } from '../../lib/form-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { Box, Flex } from '../Grid';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledSelect from '../StyledSelect';
import StyledSpinner from '../StyledSpinner';
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
    },
  ],
};

const FormFieldsContainer = styled(Flex)`
  text-transform: capitalize;
`;

const requiredFieldsQuery = gqlV2`
  query Host($slug: String, $currency: String!, $accountDetails: JSON) {
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
  let validate = input.required ? value => (value ? undefined : 'Is required') : undefined;
  if (input.type === 'text') {
    if (input.validationRegexp) {
      validate = value => {
        const matches = new RegExp(input.validationRegexp).test(value);
        if (!value && input.required) {
          return 'Is required';
        } else if (!matches && value) {
          return `Invalid ${input.name}`;
        }
      };
    }
    return (
      <Box key={input.key} mt={2} flex="1">
        <Field name={fieldName} validate={validate}>
          {({ field, meta }) => (
            <StyledInputField label={input.name} required={input.required} error={meta.touched && meta.error}>
              {() => (
                <StyledInput
                  {...field}
                  placeholder={input.example}
                  error={meta.touched && meta.error}
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
        <Field name={fieldName}>
          {({ field, meta }) => (
            <StyledInputField label={input.name} required={input.required} error={meta.touched && meta.error}>
              {() => (
                <StyledSelect
                  disabled={disabled}
                  error={meta.touched && meta.error}
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

  const { fields, title } = data.host.transferwise.requiredFields[0];

  return (
    <FormFieldsContainer flexDirection="column">
      <Box mt={2} flex="1">
        <P fontSize="LeadParagraph" fontWeight="bold">
          {title}
        </P>
      </Box>
      {
        // Displays the account holder field only if the other fields are also loaded
        Boolean(fields.length) && (
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
      {fields.map(field => (
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
    </FormFieldsContainer>
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

const availableCurrenciesQuery = gqlV2`
  query Host($slug: String) {
    host(slug: $slug) {
      slug
      transferwise {
        availableCurrencies
      }
    }
  }
`;

/**
 * Form for payout bank information. Must be used with Formik.
 */
const PayoutBankInformationForm = ({ isNew, getFieldName, host, fixedCurrency }) => {
  const { data, loading } = useQuery(availableCurrenciesQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: host.slug },
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
  const currencies = formatStringOptions(fixedCurrency ? [fixedCurrency] : availableCurrencies);
  const currencyFieldName = getFieldName('data.currency');
  const selectedCurrency = fixedCurrency || get(formik.values, currencyFieldName);

  return (
    <React.Fragment>
      <Field name={currencyFieldName}>
        {({ field, meta }) => (
          <StyledInputField
            name={field.name}
            error={meta.error && formatFormErrorMessage(meta.error)}
            label={formatMessage(msg.currency)}
            mt={3}
            mb={2}
          >
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
    transferwise: PropTypes.shape({
      availableCurrencies: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
  isNew: PropTypes.bool,
  getFieldName: PropTypes.func.isRequired,
  /** Enforces a fixedCurrency */
  fixedCurrency: PropTypes.string,
  /** A map of errors for this object */
  errors: PropTypes.object,
};

export default PayoutBankInformationForm;

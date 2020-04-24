import { useQuery } from '@apollo/react-hooks';
import { Box, Flex } from '../Grid';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Field, FastField, useFormikContext } from 'formik';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import StyledInputField from '../StyledInputField';
import StyledInput from '../StyledInput';
import StyledSpinner from '../StyledSpinner';
import StyledSelect from '../StyledSelect';
import { P } from '../Text';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { formatFormErrorMessage } from '../../lib/form-utils';
import { states } from '../../lib/constants/transferwise';

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
  query Collective($slug: String, $currency: String!) {
    collective(slug: $slug) {
      host {
        transferwise {
          requiredFields(currency: $currency) {
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
  }
`;

const RequiredFields = ({ disabled, getFieldName, formik, collective, currency }) => {
  const { loading, error, data } = useQuery(requiredFieldsQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: collective.slug, currency },
  });
  React.useEffect(() => {
    const type = get(data, 'collective.host.transferwise.requiredFields[0].type');
    if (type) {
      formik.setFieldValue(getFieldName('data.type'), type);
    }
    // Having this effect bein triggered on updates in formik and getFieldName
    // would result in infinite re-rendering.
    // This is also not necessary since these props are required.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading) {
    return <StyledSpinner />;
  }
  if (error) {
    return <P>{error.message}</P>;
  }

  const { fields, title } = data.collective.host.transferwise.requiredFields[0];
  const renderField = (field, i) => {
    const hasMultipleInputs = field.group.length > 1;
    const required = field.group.some(f => f.required);
    if (!required) {
      return null;
    }

    const renderInput = input => {
      const fieldName =
        input.key === 'accountHolderName'
          ? getFieldName(`data.${input.key}`)
          : getFieldName(`data.details.${input.key}`);
      let validate;
      switch (input.type) {
        case 'text':
          validate = input.validationRegexp
            ? value => (new RegExp(input.validationRegexp).test(value) ? undefined : `Invalid ${input.name}`)
            : undefined;
          return (
            <Box key={input.key} mt={2} flex="1">
              <FastField name={fieldName} validate={validate}>
                {({ field, meta }) => (
                  <StyledInputField label={input.name} required error={meta.touched && meta.error}>
                    {() => <Field as={StyledInput} placeholder={input.example} {...field} disabled={disabled} />}
                  </StyledInputField>
                )}
              </FastField>
            </Box>
          );
        case 'radio':
        case 'select':
          validate = value =>
            input.valuesAllowed.some(v => v.key === value) ? undefined : 'This value is not accepted.';
          return (
            <Box key={input.key} mt={2} flex="1">
              <FastField name={fieldName} validate={validate}>
                {({ field, meta }) => (
                  <StyledInputField label={input.name} required error={meta.touched && meta.error}>
                    {() => {
                      const options = formatTransferWiseSelectOptions(input.valuesAllowed);
                      return (
                        <StyledSelect
                          name={field.name}
                          options={options}
                          disabled={disabled}
                          onChange={({ value }) => formik.setFieldValue(field.name, value)}
                          value={options.find(c => c.value === get(formik.values, field.name))}
                        />
                      );
                    }}
                  </StyledInputField>
                )}
              </FastField>
            </Box>
          );
        default:
          return null;
      }
    };

    let groups = field.group;
    const selectedCountry = get(formik.values, getFieldName(`data.details.address.country`));
    if (field.group.some(g => g.key === 'address.country') && states[selectedCountry]) {
      groups = [
        ...field.group,
        {
          example: '',
          key: 'address.state',
          name: 'State',
          required: true,
          type: 'select',
          validationRegexp: null,
          valuesAllowed: states[selectedCountry],
        },
      ];
    }

    return (
      <Box key={i} flex="1">
        {hasMultipleInputs && <P fontSize="LeadParagraph">{field.name}</P>}
        {groups.filter(f => f.required).map(renderInput)}
      </Box>
    );
  };

  return (
    <FormFieldsContainer flexDirection="column">
      <Box mt={2} flex="1">
        <P fontSize="LeadParagraph" fontWeight="bold">
          {title}
        </P>
      </Box>
      {Boolean(fields.length) && renderField(accountHolderFieldOptions)}
      {fields.map(renderField)}
    </FormFieldsContainer>
  );
};

RequiredFields.propTypes = {
  disabled: PropTypes.bool,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }).isRequired,
  currency: PropTypes.string.isRequired,
  formik: PropTypes.object.isRequired,
  getFieldName: PropTypes.func.isRequired,
};

/**
 * Form for payout bank information. Must be used with Formik.
 */
const PayoutBankInformationForm = ({ isNew, getFieldName, collective }) => {
  const formik = useFormikContext();
  const { formatMessage } = useIntl();
  const currencies = formatStringOptions(collective.host?.transferwise?.availableCurrencies);
  const selectedCurrency = formik.values.payoutMethod?.data?.currency;

  return (
    <React.Fragment>
      <FastField name={getFieldName('data.currency')}>
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
                onChange={({ value }) => formik.setFieldValue(field.name, value)}
                options={currencies}
                value={currencies.find(c => c.label === selectedCurrency)}
                disabled={!isNew}
              />
            )}
          </StyledInputField>
        )}
      </FastField>
      {selectedCurrency && (
        <RequiredFields
          formik={formik}
          collective={collective}
          getFieldName={getFieldName}
          currency={selectedCurrency}
          disabled={!isNew}
        />
      )}
    </React.Fragment>
  );
};

PayoutBankInformationForm.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    host: PropTypes.shape({
      transferwise: PropTypes.shape({
        availableCurrencies: PropTypes.arrayOf(PropTypes.string),
      }),
    }),
  }).isRequired,
  isNew: PropTypes.bool,
  getFieldName: PropTypes.func.isRequired,
  /** A map of errors for this object */
  errors: PropTypes.object,
};

export default PayoutBankInformationForm;

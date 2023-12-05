import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useLazyQuery } from '@apollo/client';
import { themeGet } from '@styled-system/theme-get';
import { FastField, Field } from 'formik';
import { debounce, isEmpty, omit, pick } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { suggestSlug } from '../../lib/collective.lib';
import expenseTypes from '../../lib/constants/expenseTypes';
import { EMPTY_ARRAY } from '../../lib/constants/utils';
import { ERROR, isErrorType } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { flattenObjectDeep } from '../../lib/utils';

import { Box, Flex, Grid } from '../Grid';
import LoginBtn from '../LoginBtn';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledInputGroup from '../StyledInputGroup';
import StyledInputLocation from '../StyledInputLocation';
import StyledTextarea from '../StyledTextarea';
import { Span } from '../Text';

import PayoutMethodForm, { validatePayoutMethod } from './PayoutMethodForm';
import PayoutMethodSelect from './PayoutMethodSelect';

const validateSlugQuery = gql`
  query ValidateSlug($slug: String) {
    account(slug: $slug, throwIfMissing: false) {
      id
      slug
    }
  }
`;

const msg = defineMessages({
  nameLabel: {
    id: `ExpenseForm.inviteeLabel`,
    defaultMessage: 'Who will receive the money for this expense?',
  },
  legalName: { id: 'LegalName', defaultMessage: 'Legal Name' },
  emailLabel: {
    id: 'Form.yourEmail',
    defaultMessage: 'Your email address',
  },
  orgNameLabel: {
    id: 'ExpenseForm.inviteeOrgNameLabel',
    defaultMessage: "What's the name of the organization?",
  },
  orgSlugLabel: {
    id: 'createCollective.form.slugLabel',
    defaultMessage: 'Set your profile URL',
  },
  orgSlugErrorTaken: {
    id: 'createCollective.form.error.slug.taken',
    defaultMessage: 'Profile URL already taken',
  },
  orgWebsiteLabel: {
    id: 'createOrg.form.websiteLabel',
    defaultMessage: 'Organization website',
  },
  orgDescriptionLabel: {
    id: 'ExpenseForm.inviteeOrgDescriptionLabel',
    defaultMessage: 'What does your organization do?',
  },
  payoutOptionLabel: {
    id: `ExpenseForm.PayoutOptionLabel`,
    defaultMessage: 'Payout method',
  },
  invoiceInfo: {
    id: 'ExpenseForm.InvoiceInfo',
    defaultMessage: 'Additional invoice information',
  },
  invoiceInfoPlaceholder: {
    id: 'ExpenseForm.InvoiceInfoPlaceholder',
    defaultMessage: 'Tax ID, VAT number, etc. This information will be printed on your invoice.',
  },
  country: {
    id: 'ExpenseForm.ChooseCountry',
    defaultMessage: 'Choose country',
  },
  address: {
    id: 'ExpenseForm.AddressLabel',
    defaultMessage: 'Physical address',
  },
});

const PAYEE_TYPE = {
  USER: 'USER',
  ORG: 'ORG',
};

const Fieldset = styled.fieldset`
  border: none;
  padding: 0;
  margin: 0;
`;

const RadioOptionContainer = styled.label`
  align-items: center;
  display: flex;
  flex: 1 1 50%;
  font-size: 14px;
  font-weight: normal;
  line-height: 20px;
  margin: 0px;
  padding: 6px 16px;
  cursor: pointer;

  :not(:last-child) {
    @media (max-width: ${themeGet('breakpoints.0')}) {
      border-bottom: 1px solid #dcdee0;
    }
    @media (min-width: ${themeGet('breakpoints.0')}) {
      border-right: 1px solid #dcdee0;
    }
  }
`;

const throttledSearch = debounce((searchFunc, variables) => {
  return searchFunc({ variables });
}, 750);

const ExpenseFormPayeeSignUpStep = ({ formik, collective, onCancel, onNext }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const { values, touched, errors } = formik;
  const stepOneCompleted =
    isEmpty(flattenObjectDeep(validatePayoutMethod(values.payoutMethod))) &&
    (values.type === expenseTypes.RECEIPT ||
      (values.payoutMethod && values.payeeLocation?.country && values.payeeLocation?.address));

  const setPayoutMethod = React.useCallback(({ value }) => formik.setFieldValue('payoutMethod', value), []);
  const [payeeType, setPayeeType] = React.useState(values.payee?.organization ? PAYEE_TYPE.ORG : PAYEE_TYPE.USER);
  const [validateSlug, { data: existingSlugAccount }] = useLazyQuery(validateSlugQuery, {
    context: API_V2_CONTEXT,
  });

  const changePayeeType = e => {
    e.stopPropagation();
    setPayeeType(e.target.value);
  };

  React.useEffect(() => {
    if (values.payee?.organization?.name && !touched.payee?.organization?.slug) {
      const slug = suggestSlug(values.payee.organization.name);
      if (values.payee.organization.slug !== slug) {
        formik.setFieldValue('payee.organization.slug', suggestSlug(values.payee.organization.name));
      }
    }
  }, [values.payee?.organization?.name]);
  React.useEffect(() => {
    if (payeeType === PAYEE_TYPE.USER) {
      formik.setFieldValue('payee', omit(values.payee, ['organization']));
    } else if (payeeType === PAYEE_TYPE.ORG && values.draft?.payee?.organization) {
      formik.setFieldValue('payee', { ...values.payee, organization: values.draft.payee.organization });
    }
  }, [payeeType]);
  // Slug Validation
  React.useEffect(() => {
    if (values.payee?.organization?.slug) {
      throttledSearch(validateSlug, { slug: values.payee.organization.slug });
    }
  }, [values.payee?.organization?.slug]);

  const handleSlugValidation = async value => {
    if (value === existingSlugAccount?.account?.slug) {
      return formatMessage(msg.orgSlugErrorTaken);
    }
  };

  return (
    <Fragment>
      <StyledInputField label="How you will receive the money of this expense?" labelFontSize="13px" mt={3}>
        <StyledCard>
          <Fieldset onChange={changePayeeType}>
            <Flex flexDirection={['column', 'row']} overflow="hidden">
              <RadioOptionContainer>
                <Box alignSelf={['center', 'baseline', null, 'center']} mr="16px">
                  <input
                    type="radio"
                    name="payeeType"
                    checked={payeeType === PAYEE_TYPE.USER}
                    value={PAYEE_TYPE.USER}
                    onChange={changePayeeType}
                  />
                </Box>
                <Box>Personal Account</Box>
              </RadioOptionContainer>
              <RadioOptionContainer>
                <Box alignSelf={['center', 'baseline', null, 'center']} mr="16px">
                  <input
                    type="radio"
                    name="payeeType"
                    checked={payeeType === PAYEE_TYPE.ORG}
                    value={PAYEE_TYPE.ORG}
                    onChange={changePayeeType}
                  />
                </Box>
                <Box>Organization Account</Box>
              </RadioOptionContainer>
            </Flex>
          </Fieldset>
        </StyledCard>
      </StyledInputField>

      {payeeType === PAYEE_TYPE.ORG && (
        <Fragment>
          <Grid gridTemplateColumns={['100%', 'calc(50% - 8px) calc(50% - 8px)']} gridColumnGap={[null, 2, null, 3]}>
            <Field name="payee.organization.name">
              {({ field }) => (
                <StyledInputField name={field.name} label={formatMessage(msg.orgNameLabel)} labelFontSize="13px" mt={3}>
                  {inputProps => <StyledInput {...inputProps} {...field} placeholder="e.g., Airbnb, Salesforce" />}
                </StyledInputField>
              )}
            </Field>
            <Field name="payee.organization.slug" validate={handleSlugValidation}>
              {({ field }) => (
                <StyledInputField
                  mt={3}
                  labelFontSize="13px"
                  error={errors.payee?.organization?.slug}
                  name={field.name}
                  label={formatMessage(msg.orgSlugLabel)}
                >
                  {inputProps => <StyledInputGroup {...inputProps} {...field} prepend="opencollective.com/" />}
                </StyledInputField>
              )}
            </Field>
            <Field name="payee.organization.website">
              {({ field }) => (
                <StyledInputField
                  name={field.name}
                  label={formatMessage(msg.orgWebsiteLabel)}
                  labelFontSize="13px"
                  mt={3}
                >
                  {inputProps => <StyledInputGroup {...inputProps} {...field} prepend="http://" />}
                </StyledInputField>
              )}
            </Field>

            <Field name="payee.organization.description">
              {({ field }) => (
                <StyledInputField
                  name={field.name}
                  label={formatMessage(msg.orgDescriptionLabel)}
                  labelFontSize="13px"
                  mt={3}
                >
                  {inputProps => <StyledInput {...inputProps} {...field} placeholder="" />}
                </StyledInputField>
              )}
            </Field>
          </Grid>
        </Fragment>
      )}

      <Grid
        gridTemplateColumns={['100%', 'calc(50% - 8px) calc(50% - 8px)']}
        gridColumnGap={[null, 2, null, 3]}
        gridAutoFlow="dense"
      >
        <Box>
          <Field name="payee.name">
            {({ field }) => (
              <StyledInputField name={field.name} label={formatMessage(msg.nameLabel)} labelFontSize="13px" mt={3}>
                {inputProps => <StyledInput {...inputProps} {...field} />}
              </StyledInputField>
            )}
          </Field>
          {payeeType === PAYEE_TYPE.ORG && (
            <Span fontSize="11px" lineHeight="16px" color="black.600">
              <FormattedMessage
                id="ExpenseForm.SignUp.OrgAdminNote"
                defaultMessage="You need to be an admin of the Organization to submit expenses."
              />
            </Span>
          )}
        </Box>
        <Box>
          <Field name="payee.email" required>
            {({ field }) => (
              <StyledInputField
                name={field.name}
                label={formatMessage(msg.emailLabel)}
                labelFontSize="13px"
                error={errors.payee?.email}
                mt={3}
              >
                {inputProps => <StyledInput {...inputProps} {...field} type="email" />}
              </StyledInputField>
            )}
          </Field>
          <Span fontSize="11px" lineHeight="16px" color="black.600">
            <FormattedMessage
              id="ExpenseForm.SignUp.SignIn"
              defaultMessage="We will use this email to create your account. If you already have an account {loginLink}."
              values={{ loginLink: <LoginBtn asLink /> }}
            />
          </Span>
        </Box>
        <Box>
          <Box>
            <Field name={payeeType === PAYEE_TYPE.ORG ? 'payee.organization.legalName' : 'payee.legalName'}>
              {({ field }) => (
                <StyledInputField
                  name={field.name}
                  isPrivate
                  required={false}
                  label={formatMessage(msg.legalName)}
                  labelFontSize="13px"
                  mt={3}
                >
                  {inputProps => <StyledInput {...inputProps} {...field} />}
                </StyledInputField>
              )}
            </Field>
            <Span fontSize="11px" lineHeight="16px" color="black.600">
              <FormattedMessage
                id="editCollective.legalName.description"
                defaultMessage="Legal names are private and used in receipts, tax forms, payment details on expenses, and other non-public contexts. Legal names are only visible to admins."
              />
            </Span>
          </Box>
          <Box mt={3}>
            <StyledInputLocation
              onChange={values => {
                formik.setFieldValue('payeeLocation', values);
              }}
              location={values.payeeLocation}
              errors={errors.payeeLocation}
              required
            />
          </Box>
        </Box>
        <Box>
          <Field name="payoutMethod">
            {({ field }) => (
              <StyledInputField
                name={field.name}
                htmlFor="payout-method"
                flex="1"
                mt={3}
                label={formatMessage(msg.payoutOptionLabel)}
                labelFontSize="13px"
                error={
                  isErrorType(errors.payoutMethod, ERROR.FORM_FIELD_REQUIRED)
                    ? formatFormErrorMessage(intl, errors.payoutMethod)
                    : null
                }
              >
                {({ id, error }) => (
                  <PayoutMethodSelect
                    inputId={id}
                    error={error}
                    onChange={setPayoutMethod}
                    payoutMethod={values.payoutMethod}
                    payoutMethods={EMPTY_ARRAY}
                    payee={values.payee}
                    disabled={!values.payee}
                    collective={collective}
                  />
                )}
              </StyledInputField>
            )}
          </Field>
          {values.payoutMethod && (
            <Field name="payoutMethod">
              {({ field, meta }) => (
                <Box mt={3} flex="1">
                  <PayoutMethodForm
                    fieldsPrefix="payoutMethod"
                    payoutMethod={field.value}
                    host={collective.host}
                    errors={meta.error}
                  />
                </Box>
              )}
            </Field>
          )}
        </Box>

        <FastField name="invoiceInfo">
          {({ field }) => (
            <StyledInputField
              name={field.name}
              label={formatMessage(msg.invoiceInfo)}
              labelFontSize="13px"
              required={false}
              mt={3}
              gridColumn={1}
            >
              {inputProps => (
                <Field
                  as={StyledTextarea}
                  {...inputProps}
                  {...field}
                  minHeight={80}
                  placeholder={formatMessage(msg.invoiceInfoPlaceholder)}
                />
              )}
            </StyledInputField>
          )}
        </FastField>
      </Grid>
      {values.payee && (
        <Fragment>
          <StyledHr flex="1" mt={4} borderColor="black.300" />
          <Flex mt={3} flexWrap="wrap">
            {onCancel && (
              <StyledButton
                type="button"
                width={['100%', 'auto']}
                mx={[2, 0]}
                mr={[null, 3]}
                mt={2}
                whiteSpace="nowrap"
                data-cy="expense-cancel"
                disabled={!stepOneCompleted}
                onClick={() => {
                  onCancel?.();
                }}
              >
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </StyledButton>
            )}
            <StyledButton
              type="button"
              width={['100%', 'auto']}
              mx={[2, 0]}
              mr={[null, 3]}
              mt={2}
              whiteSpace="nowrap"
              data-cy="expense-next"
              buttonStyle="primary"
              disabled={!stepOneCompleted}
              onClick={async () => {
                const allErrors = await formik.validateForm();
                const errors = omit(pick(allErrors, ['payee', 'payoutMethod', 'payeeLocation']), [
                  'payoutMethod.data.currency',
                ]);
                if (isEmpty(flattenObjectDeep(errors))) {
                  onNext?.();
                } else {
                  // We use set touched here to display errors on fields that are not dirty.
                  formik.setTouched(errors);
                  formik.setErrors(errors);
                }
              }}
            >
              <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
              &nbsp;→
            </StyledButton>
          </Flex>
        </Fragment>
      )}
    </Fragment>
  );
};

ExpenseFormPayeeSignUpStep.propTypes = {
  formik: PropTypes.object,
  onCancel: PropTypes.func,
  onNext: PropTypes.func,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    host: PropTypes.shape({
      transferwise: PropTypes.shape({
        availableCurrencies: PropTypes.arrayOf(PropTypes.object),
      }),
    }),
    settings: PropTypes.object,
  }).isRequired,
};

export default ExpenseFormPayeeSignUpStep;

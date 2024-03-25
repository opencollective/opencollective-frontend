import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import { FastField, Field } from 'formik';
import { get, isEmpty, omit } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { suggestSlug } from '../../lib/collective';
import { EMPTY_ARRAY } from '../../lib/constants/utils';
import { ERROR, isErrorType } from '../../lib/errors';
import { formatFormErrorMessage, requireFields, verifyEmailPattern } from '../../lib/form-utils';
import { reportValidityHTML5 } from '../../lib/utils';

import { Box, Flex, Grid } from '../Grid';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputGroup from '../StyledInputGroup';
import StyledInputLocation from '../StyledInputLocation';
import StyledLinkButton from '../StyledLinkButton';
import StyledTextarea from '../StyledTextarea';
import { P } from '../Text';

import PayoutMethodForm from './PayoutMethodForm';
import PayoutMethodSelect from './PayoutMethodSelect';

const msg = defineMessages({
  accountType: {
    id: `ExpenseForm.inviteeLabel`,
    defaultMessage: 'Who will receive the money for this expense?',
  },
  nameLabel: {
    id: `ContactName`,
    defaultMessage: 'Contact name',
  },
  emailTitle: {
    id: 'User.EmailAddress',
    defaultMessage: 'Email address',
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
  recipientNoteLabel: {
    id: 'ExpenseForm.RecipientNoteLabel',
    defaultMessage: 'Add a note for the recipient',
  },
  additionalInfo: {
    id: 'ExpenseForm.inviteAdditionalInfo',
    defaultMessage: 'Want to enter payout details, such as a PayPal address or bank account?',
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
    id: 'ExpenseForm.inviteOrgDescriptionLabel',
    defaultMessage: 'Organization description',
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

export const validateExpenseFormPayeeInviteNewStep = values => {
  const errors = requireFields(values, ['payee.name', 'payee.email']);
  if (!get(errors, 'payee.email')) {
    verifyEmailPattern(errors, values, 'payee.email');
  }
  return errors;
};

const ExpenseFormPayeeInviteNewStep = ({ formik, collective = null, onBack, onNext, hidePayoutDetails = false }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const { values, touched, errors } = formik;
  const setPayoutMethod = React.useCallback(({ value }) => formik.setFieldValue('payoutMethod', value), []);
  const [payeeType, setPayeeType] = React.useState(PAYEE_TYPE.USER);
  const [showAdditionalInfo, setAdditionalInfo] = React.useState(
    !isEmpty(values.payeeLocation) || !isEmpty(values.payoutMethod),
  );

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
    }
  }, [payeeType]);

  const changePayeeType = e => {
    e.stopPropagation();
    setPayeeType(e.target.value);
  };

  return (
    <Fragment>
      <StyledInputField label={formatMessage(msg.accountType)} labelFontSize="13px" mt={3}>
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
                    data-cy="payee-type-user"
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
                    data-cy="payee-type-org"
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
                <StyledInputField
                  name={field.name}
                  label={formatMessage(msg.orgNameLabel)}
                  labelFontSize="13px"
                  mt={3}
                  required
                >
                  {inputProps => <StyledInput {...inputProps} {...field} placeholder="e.g., Airbnb, Salesforce" />}
                </StyledInputField>
              )}
            </Field>
            <Field name="payee.organization.slug">
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
                  required={false}
                  mt={3}
                >
                  {inputProps => <StyledInputGroup {...inputProps} {...field} prepend="https://" />}
                </StyledInputField>
              )}
            </Field>

            <Field name="payee.organization.description">
              {({ field }) => (
                <StyledInputField
                  name={field.name}
                  label={formatMessage(msg.orgDescriptionLabel)}
                  labelFontSize="13px"
                  required={false}
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
          <StyledInputFormikField
            name="payee.name"
            htmlFor="payee.name"
            required
            label={formatMessage(msg.nameLabel)}
            labelFontSize="13px"
            mt={3}
          >
            {({ field }) => <StyledInput {...field} />}
          </StyledInputFormikField>
        </Box>
        <Box>
          <StyledInputFormikField
            name="payee.email"
            htmlFor="payee.email"
            label={formatMessage(msg.emailTitle)}
            required
            labelFontSize="13px"
            mt={3}
          >
            {({ field }) => <StyledInput {...field} type="email" />}
          </StyledInputFormikField>
        </Box>

        {hidePayoutDetails ? null : !showAdditionalInfo ? (
          <Box gridColumn={[null, '1 / span 2']} mt={3}>
            <MessageBox type="info">
              <P fontSize="12px">{formatMessage(msg.additionalInfo)}</P>
              <P fontSize="12px" mt={2}>
                <StyledLinkButton onClick={() => setAdditionalInfo(true)}>
                  <FormattedMessage id="ExpenseForm.inviteAdditionalInfoBtn" defaultMessage="Add payout details" />
                </StyledLinkButton>
              </P>
            </MessageBox>
          </Box>
        ) : (
          <Fragment>
            <Box mt={3}>
              <StyledInputLocation
                onChange={values => {
                  formik.setFieldValue('payeeLocation', values);
                }}
                location={values.payeeLocation}
                errors={errors.payeeLocation}
                required={false}
              />
            </Box>
            <Box>
              <Field name="payoutMethod">
                {({ field }) => (
                  <StyledInputField
                    name={field.name}
                    htmlFor="payout-method"
                    flex="1"
                    mt={3}
                    required={false}
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
                        required={false}
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
          </Fragment>
        )}
      </Grid>
      <Box>
        <Field name="recipientNote">
          {({ field }) => (
            <StyledInputField
              name={field.name}
              label={formatMessage(msg.recipientNoteLabel)}
              labelFontSize="13px"
              required={false}
              mt={3}
            >
              {inputProps => <Field as={StyledTextarea} {...inputProps} {...field} minHeight={80} />}
            </StyledInputField>
          )}
        </Field>
      </Box>
      {values.payee && (onBack || onNext) && (
        <Fragment>
          <StyledHr flex="1" mt={4} borderColor="black.300" />
          <Flex mt={3} flexWrap="wrap">
            {onBack && (
              <StyledButton
                type="button"
                width={['100%', 'auto']}
                mx={[2, 0]}
                mr={[null, 3]}
                mt={2}
                whiteSpace="nowrap"
                data-cy="expense-cancel"
                onClick={() => {
                  onBack?.();
                }}
              >
                ←&nbsp;
                <FormattedMessage id="Back" defaultMessage="Back" />
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
              onClick={e => {
                const isFormValid = reportValidityHTML5(e.target.form);
                const errors = validateExpenseFormPayeeInviteNewStep(values);
                if (!isEmpty(errors)) {
                  formik.setErrors(errors);
                } else if (isFormValid) {
                  onNext();
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

ExpenseFormPayeeInviteNewStep.propTypes = {
  formik: PropTypes.object,
  payoutProfiles: PropTypes.array,
  onBack: PropTypes.func,
  onNext: PropTypes.func,
  hidePayoutDetails: PropTypes.bool,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    type: PropTypes.string,
    host: PropTypes.shape({
      transferwise: PropTypes.shape({
        availableCurrencies: PropTypes.arrayOf(PropTypes.object),
      }),
    }),
    settings: PropTypes.object,
  }),
};

export default ExpenseFormPayeeInviteNewStep;

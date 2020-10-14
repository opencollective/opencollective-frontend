import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { isEmail } from 'validator';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import InputTypeCountry from '../InputTypeCountry';
import Link from '../Link';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledLink from '../StyledLink';
import StyledTextarea from '../StyledTextarea';
import { P } from '../Text';

import StepProfileInfoMessage from './StepProfileInfoMessage';

// TODO validate
export const validateGuestProfile = stepProfile => {
  if (!stepProfile.email || !isEmail(stepProfile.email)) {
    return false;
  } else {
    return true;
  }
};

const NewContributionFlowStepProfileGuestForm = ({ stepDetails, onChange, data }) => {
  const [locale, setLocale] = useState('en'); // TODO We need the country, not the locale. Also auto-detects from IP
  const { amount, interval } = stepDetails;
  const dispatchChange = (field, value) => onChange({ stepProfile: { ...data, isGuest: true, [field]: value } });

  return (
    <Container as="fieldset" border="none" width={1} py={3}>
      <Flex justifyContent="space-between">
        <Box width={1 / 2} mb={3} mr={1}>
          <StyledInputField
            label={<FormattedMessage id="Fields.FullName" defaultMessage="Full name" />}
            htmlFor="name"
            required={amount < 25000 ? false : true}
            showLabelRequired
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                defaultValue={data?.name}
                placeholder="i.e. Thomas Anderson"
                onChange={e => dispatchChange(e.target.name, e.target.value)}
                maxLength="255"
              />
            )}
          </StyledInputField>
        </Box>
        <Box width={1 / 2} mb={3} ml={1}>
          <StyledInputField
            label={<FormattedMessage id="Email" defaultMessage="Email" />}
            htmlFor="email"
            maxLength="254"
            required
            showLabelRequired
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                defaultValue={data?.email}
                placeholder="i.e. tanderson@thematrix.com"
                type="email"
                onChange={e => dispatchChange(e.target.name, e.target.value)}
              />
            )}
          </StyledInputField>
        </Box>
      </Flex>
      {amount && amount >= 500000 && (
        <Flex justifyContent="space-between">
          <Box width={1 / 2} mb={3} mr={1}>
            <StyledInputField
              label={<FormattedMessage id="ExpenseForm.AddressLabel" defaultMessage="Physical address" />}
              htmlFor="address"
              required
              showLabelRequired
            >
              {inputProps => (
                <StyledTextarea
                  {...inputProps}
                  defaultValue={data?.address}
                  placeholder="160 Zion Ln.&#13;&#10;Temecula, CA&#13;&#10;90210"
                  width="100%"
                  height="150px"
                  maxWidth={350}
                  fontSize="13px"
                  onChange={e => dispatchChange(e.target.name, e.target.value)}
                />
              )}
            </StyledInputField>
          </Box>
          <Box width={1 / 2} mb={3} ml={1}>
            <StyledInputField
              name="country"
              label={<FormattedMessage id="ExpenseForm.ChooseCountry" defaultMessage="Choose country" />}
              htmlFor="country"
              required
              showLabelRequired
            >
              {inputProps => (
                <InputTypeCountry
                  {...inputProps}
                  locale={locale}
                  onChange={value => {
                    setLocale(value);
                    dispatchChange(e.target.name, e.target.value);
                  }}
                  value={data?.country}
                />
              )}
            </StyledInputField>
          </Box>
        </Flex>
      )}
      <P fontSize="11px" color="black.600">
        <FormattedMessage
          id="ContributionFlow.PublicContribution"
          defaultMessage="Your name and contribution will be public."
        />
      </P>
      <StepProfileInfoMessage amount={amount} />
      {interval && (
        <P color="black.500" fontSize="12px" my={3} data-cy="join-conditions">
          <FormattedMessage
            id="SignIn.legal"
            defaultMessage="By joining, you agree to our <tos-link>Terms of Service</tos-link> and <privacy-policy-link>Privacy Policy</privacy-policy-link>."
            values={{
              'tos-link': getI18nLink({ as: Link, route: '/tos' }),
              'privacy-policy-link': getI18nLink({ as: Link, route: '/privacypolicy' }),
            }}
          />
        </P>
      )}
      <Flex width={1} alignItems="center" justifyContent="center" my={3}>
        <StyledHr width="100%" borderColor="black.300" />
      </Flex>
      <Flex alignItems="center" mt={3}>
        <P fontSize="14px" mr={2}>
          <FormattedMessage id="CreateProfile.AlreadyHaveAnAccount" defaultMessage="Already have an account?" />
        </P>
        <StyledLink as={Link} route="/signin" fontSize="14px">
          <FormattedMessage id="signIn" defaultMessage="Sign In" />
          &nbsp;→
        </StyledLink>
      </Flex>
    </Container>
  );
};

NewContributionFlowStepProfileGuestForm.propTypes = {
  stepDetails: PropTypes.shape({
    amount: PropTypes.number,
    interval: PropTypes.string,
  }),
  data: PropTypes.object,
  onChange: PropTypes.func,
};

export default NewContributionFlowStepProfileGuestForm;

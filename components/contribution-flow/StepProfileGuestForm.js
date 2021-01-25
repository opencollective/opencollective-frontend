import React from 'react';
import PropTypes from 'prop-types';
import { set } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { isEmail } from 'validator';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import I18nFormatters from '../I18nFormatters';
import InputTypeCountry from '../InputTypeCountry';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledTextarea from '../StyledTextarea';
import { P } from '../Text';

import StepProfileInfoMessage from './StepProfileInfoMessage';
import { getTotalAmount } from './utils';

const shouldRequireAllInfo = amount => {
  return amount && amount >= 500000;
};

export const validateGuestProfile = (stepProfile, stepDetails) => {
  if (shouldRequireAllInfo(getTotalAmount(stepDetails))) {
    if (!stepProfile.name || !stepProfile.location?.address || !stepProfile.location?.country) {
      return false;
    }
  }

  if (!stepProfile.email || !isEmail(stepProfile.email)) {
    return false;
  } else {
    return true;
  }
};

const StepProfileGuestForm = ({ stepDetails, onChange, data, onSignInClick }) => {
  const totalAmount = getTotalAmount(stepDetails);
  const dispatchChange = (field, value) => {
    const newData = set({ ...data, isGuest: true }, field, value);
    onChange({ stepProfile: newData });
  };

  return (
    <Container as="fieldset" border="none" width={1} py={3}>
      <Flex justifyContent="space-between">
        <Box width={1 / 2} mb={3} mr={1}>
          <StyledInputField
            label={<FormattedMessage id="User.FullName" defaultMessage="Full name" />}
            htmlFor="name"
            required={totalAmount < 25000 ? false : true}
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
      {shouldRequireAllInfo(totalAmount) && (
        <Flex justifyContent="space-between">
          <Box width={1 / 2} mb={3} mr={1}>
            <StyledInputField
              label={<FormattedMessage id="ExpenseForm.AddressLabel" defaultMessage="Physical address" />}
              htmlFor="location.address"
              required
            >
              {inputProps => (
                <StyledTextarea
                  {...inputProps}
                  value={data?.location?.address ?? ''}
                  placeholder="160 Zion Ln.&#13;&#10;Temecula, CA&#13;&#10;90210"
                  width="100%"
                  minHeight="80px"
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
            >
              {inputProps => (
                <InputTypeCountry
                  {...inputProps}
                  autoDetect
                  onChange={value => dispatchChange('location.country', value)}
                  value={data?.location?.country}
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
      <StepProfileInfoMessage amount={totalAmount} interval={stepDetails.interval} />
      {stepDetails.interval && (
        <P color="black.500" fontSize="12px" my={3} data-cy="join-conditions">
          <FormattedMessage
            id="SignIn.legal"
            defaultMessage="By joining, you agree to our <TOSLink>Terms of Service</TOSLink> and <PrivacyPolicyLink>Privacy Policy</PrivacyPolicyLink>."
            values={I18nFormatters}
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
        <StyledButton
          onClick={onSignInClick}
          type="button"
          buttonStyle="secondary"
          buttonSize="tiny"
          isBorderless
          data-cy="cf-profile-signin-btn"
        >
          <FormattedMessage id="signIn" defaultMessage="Sign In" />
          &nbsp;→
        </StyledButton>
      </Flex>
    </Container>
  );
};

StepProfileGuestForm.propTypes = {
  stepDetails: PropTypes.shape({
    amount: PropTypes.number,
    interval: PropTypes.string,
  }).isRequired,
  data: PropTypes.object,
  onChange: PropTypes.func,
  onSignInClick: PropTypes.func,
};

export default StepProfileGuestForm;

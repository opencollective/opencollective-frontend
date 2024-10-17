import React from 'react';
import PropTypes from 'prop-types';
import { set } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { isEmail } from 'validator';

import Captcha, { isCaptchaEnabled } from '../Captcha';
import Container from '../Container';
import { Flex } from '../Grid';
import I18nFormatters, { getI18nLink } from '../I18nFormatters';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import Link from '../Link';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledInputLocation from '../StyledInputLocation';
import { P, Span } from '../Text';

import StepProfileInfoMessage from './StepProfileInfoMessage';
import { contributionRequiresAddress, contributionRequiresLegalName } from './utils';

export const validateGuestProfile = (stepProfile, stepDetails, tier) => {
  if (contributionRequiresAddress(stepDetails, tier)) {
    const location = stepProfile.location || {};
    if (!location.country || !(location.address || location.structured)) {
      return false;
    }
  }
  if (contributionRequiresLegalName(stepDetails, tier)) {
    if (!stepProfile.name && !stepProfile.legalName) {
      return false;
    }
  }

  if (isCaptchaEnabled() && !stepProfile.captcha) {
    return false;
  }

  if (!stepProfile.email || !isEmail(stepProfile.email)) {
    return false;
  } else {
    return true;
  }
};

const getSignInLinkQueryParams = email => {
  const params = { next: typeof window !== 'undefined' ? window.location.pathname : '' };
  return email ? { ...params, email } : params;
};

const StepProfileGuestForm = ({ stepDetails, onChange, data, isEmbed, onSignInClick, tier }) => {
  const dispatchChange = (field, value) => onChange({ stepProfile: set({ ...data, isGuest: true }, field, value) });
  const dispatchGenericEvent = e => dispatchChange(e.target.name, e.target.value);

  return (
    <Container border="none" width={1} pb={3}>
      <StyledInputField
        htmlFor="email"
        label={<FormattedMessage defaultMessage="Your email" id="nONnTw" />}
        labelFontSize="16px"
        labelFontWeight="700"
        maxLength="254"
        required
        hint={
          !isEmbed && (
            <FormattedMessage
              defaultMessage="If you already have an account or want to contribute as an organization, <SignInLink>Sign in</SignInLink>."
              id="ucWzrM"
              values={{
                SignInLink: getI18nLink({
                  as: Link,
                  href: { pathname: '/signin', query: getSignInLinkQueryParams(data?.email) },
                  'data-cy': 'cf-profile-signin-btn',
                  onClick: e => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSignInClick();
                  },
                }),
              }}
            />
          )
        }
      >
        {inputProps => (
          <StyledInput
            {...inputProps}
            value={data?.email || ''}
            placeholder="tanderson@thematrix.com"
            type="email"
            onChange={dispatchGenericEvent}
          />
        )}
      </StyledInputField>
      <StyledHr my="18px" borderColor="black.300" />
      <StyledInputField
        htmlFor="name"
        label={<FormattedMessage defaultMessage="Your name" id="vlKhIl" />}
        labelFontSize="16px"
        labelFontWeight="700"
        required={false}
        hint={
          <FormattedMessage
            defaultMessage="This is your display name or alias. Leave it in blank to appear as guest."
            id="h1BHRl"
          />
        }
      >
        {inputProps => (
          <StyledInput
            {...inputProps}
            value={data?.name || ''}
            placeholder="Thomas Anderson"
            onChange={dispatchGenericEvent}
            maxLength="255"
          />
        )}
      </StyledInputField>
      <StyledInputField
        htmlFor="legalName"
        label={<FormattedMessage defaultMessage="Legal name" id="OozR1Y" />}
        labelFontSize="16px"
        labelFontWeight="700"
        isPrivate
        required={contributionRequiresLegalName(stepDetails, tier) && !data?.name}
        mt={20}
        hint={
          <FormattedMessage
            defaultMessage="If different from your display name. Not public. Important for receipts, invoices, payments, and official documentation."
            id="QLBxEF"
          />
        }
      >
        {inputProps => (
          <StyledInput
            {...inputProps}
            value={data?.legalName || ''}
            placeholder="Thomas A. Anderson"
            onChange={dispatchGenericEvent}
            maxLength="255"
          />
        )}
      </StyledInputField>
      {isCaptchaEnabled() && (
        <Flex mt="18px" justifyContent="center">
          <Captcha onVerify={result => dispatchChange('captcha', result)} />
        </Flex>
      )}
      {contributionRequiresAddress(stepDetails, tier) && (
        <React.Fragment>
          <Flex alignItems="center" my="14px">
            <P fontSize="24px" lineHeight="32px" fontWeight="500" mr={2}>
              <FormattedMessage id="collective.address.label" defaultMessage="Address" />
            </P>
            <Span mr={2} lineHeight="0">
              <PrivateInfoIcon className="text-muted-foreground" />
            </Span>
            <StyledHr my="18px" borderColor="black.300" width="100%" />
          </Flex>
          <StyledInputLocation
            autoDetectCountry
            location={data?.location}
            onChange={value => dispatchChange('location', value)}
            labelFontSize="16px"
            labelFontWeight="700"
          />
        </React.Fragment>
      )}
      <StepProfileInfoMessage isGuest hasLegalNameField />
      <P color="black.500" fontSize="12px" mt={4} data-cy="join-conditions">
        <FormattedMessage
          defaultMessage="By contributing, you agree to our <TOSLink>Terms of Service</TOSLink> and <PrivacyPolicyLink>Privacy Policy</PrivacyPolicyLink>."
          id="Amj+Gh"
          values={I18nFormatters}
        />
      </P>
    </Container>
  );
};

StepProfileGuestForm.propTypes = {
  stepDetails: PropTypes.shape({
    amount: PropTypes.number,
    interval: PropTypes.string,
  }).isRequired,
  data: PropTypes.object,
  onSignInClick: PropTypes.func,
  onChange: PropTypes.func,
  defaultEmail: PropTypes.string,
  defaultName: PropTypes.string,
  isEmbed: PropTypes.bool,
  tier: PropTypes.object,
};

export default StepProfileGuestForm;

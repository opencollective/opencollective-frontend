import React from 'react';
import { set } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { isEmail } from 'validator';

import { formatCurrency } from '../../lib/currency-utils';

import Captcha, { isCaptchaEnabled } from '../Captcha';
import { Flex } from '../Grid';
import I18nFormatters, { getI18nLink } from '../I18nFormatters';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import Link from '../Link';
import MessageBox from '../MessageBox';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledInputLocation from '../StyledInputLocation';
import { P, Span } from '../Text';

import { getRequiredInformation } from './utils';

export const validateGuestProfile = (stepProfile, stepDetails, tier, collective) => {
  const requiredInformation = getRequiredInformation(undefined, stepDetails, collective, undefined, tier);
  if (requiredInformation.address) {
    const location = stepProfile.location || {};
    if (!location.country || !(location.address || location.structured)) {
      return false;
    }
  }
  if (requiredInformation.legalName) {
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

const StepProfileGuestForm = ({ stepDetails, onChange, data, isEmbed, onSignInClick, tier, collective }) => {
  const dispatchChange = (field, value) => onChange({ stepProfile: set({ ...data, isGuest: true }, field, value) });
  const dispatchGenericEvent = e => dispatchChange(e.target.name, e.target.value);
  const requiredInformation = React.useMemo(
    () => getRequiredInformation(undefined, stepDetails, collective, undefined, tier),
    [stepDetails, collective, tier],
  );

  return (
    <div className="flex flex-col gap-4">
      <MessageBox type="info">
        <h1 className="font-bold">
          <FormattedMessage defaultMessage="Privacy Information" id="AyQ5sz" />
        </h1>
        <p>
          <FormattedMessage
            defaultMessage="When you contribute to {collectiveName}, your email address will be shared with its administrators.{isSelfHosted, select, false { It will also be shared with {hostName}, the legal entity that provides {collectiveName} with financial services and will be receiving this contribution on their behalf.} other {}}"
            id="iVRVyA"
            values={{
              collectiveName: collective.name,
              hostName: <Link href={`/${collective.host.slug}`}>{collective.host.name}</Link>,
              isSelfHosted: collective.id === collective.host.id,
            }}
          />
        </p>
        <p className="mt-2">
          <FormattedMessage
            defaultMessage="<PrivacyPolicyLink>Read our privacy policy</PrivacyPolicyLink>."
            id="ReadOurPrivacyPolicy"
            values={{
              PrivacyPolicyLink: getI18nLink({ href: '/privacypolicy', openInNewTab: true, as: Link }),
            }}
          />
        </p>
      </MessageBox>
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
      <StyledHr my="4px" borderColor="black.300" />
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
            data-cy="input-name"
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
        hideOptionalLabel={requiredInformation.legalName}
        required={requiredInformation.legalName && !data?.name}
        hint={
          requiredInformation.legalName ? (
            <FormattedMessage
              defaultMessage="Required for legal purposes as your total anual contribution is more than {amount}. This information is private but it will be shared with {collectiveName}{isSelfHosted, select, false { and {hostName}} other {}}."
              id="RGpvqu"
              values={{
                amount: formatCurrency(collective.policies.CONTRIBUTOR_INFO_THRESHOLDS.legalName, collective.currency),
                hostName: collective.host.name,
                collectiveName: collective.name,
                isSelfHosted: collective.id === collective.host.id,
              }}
            />
          ) : (
            <FormattedMessage
              defaultMessage="Important for receipts, invoices, payments and official documentation if different from your name."
              id="LdGP5g"
            />
          )
        }
      >
        {inputProps => (
          <StyledInput
            {...inputProps}
            value={data?.legalName || ''}
            data-cy="input-legalName"
            placeholder="Thomas A. Anderson"
            onChange={dispatchGenericEvent}
            maxLength="255"
          />
        )}
      </StyledInputField>
      {requiredInformation.address && (
        <React.Fragment>
          <Flex alignItems="center">
            <P fontSize="24px" lineHeight="32px" fontWeight="500" mr={2}>
              <FormattedMessage id="collective.address.label" defaultMessage="Address" />
            </P>
            <Span mr={2} lineHeight="0">
              <PrivateInfoIcon className="text-muted-foreground" />
            </Span>
            <StyledHr my="16px" borderColor="black.300" width="100%" />
          </Flex>
          <MessageBox type="info">
            <h1 className="font-bold">
              <FormattedMessage defaultMessage="Address Requirement" id="Mc7YHZ" />
            </h1>
            <p>
              <FormattedMessage
                defaultMessage="Your total contributions in the current fiscal year to {isSelfHosted, select, true {{collectiveName}} other {{hostLink}, the legal entity that provides {collectiveName} with financial services,}} exceeds {amount}. Therefore, {hostName} requires your legal address."
                id="/Lrubf"
                values={{
                  amount: formatCurrency(collective.policies.CONTRIBUTOR_INFO_THRESHOLDS.address, collective.currency),
                  collectiveName: collective.name,
                  hostName: collective.host.name,
                  hostLink: <Link href={`/${collective.host.slug}`}>{collective.host.name}</Link>,
                  isSelfHosted: collective.id === collective.host.id,
                }}
              />
            </p>
            <p className="mt-2">
              <FormattedMessage
                defaultMessage="<PrivacyPolicyLink>Read our privacy policy</PrivacyPolicyLink>."
                id="ReadOurPrivacyPolicy"
                values={{
                  PrivacyPolicyLink: getI18nLink({ href: '/privacypolicy', openInNewTab: true, as: Link }),
                }}
              />
            </p>
          </MessageBox>
          <StyledInputLocation
            autoDetectCountry
            location={data?.location}
            onChange={value => dispatchChange('location', value)}
            labelFontSize="16px"
            labelFontWeight="700"
          />
        </React.Fragment>
      )}
      {isCaptchaEnabled() && (
        <Flex justifyContent="center">
          <Captcha onVerify={result => dispatchChange('captcha', result)} />
        </Flex>
      )}
      <P color="black.500" fontSize="12px" data-cy="join-conditions">
        <FormattedMessage
          defaultMessage="By contributing, you agree to our <TOSLink>Terms of Service</TOSLink> and <PrivacyPolicyLink>Privacy Policy</PrivacyPolicyLink>."
          id="Amj+Gh"
          values={I18nFormatters}
        />
      </P>
    </div>
  );
};

export default StepProfileGuestForm;

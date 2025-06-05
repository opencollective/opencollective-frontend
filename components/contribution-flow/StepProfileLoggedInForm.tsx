import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';

import { Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import Link from '../Link';
import MessageBox from '../MessageBox';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledInputLocation from '../StyledInputLocation';
import { P, Span } from '../Text';

import ContributeProfilePicker from './ContributeProfilePicker';
import { getRequiredInformation } from './utils';

export const NEW_ORGANIZATION_KEY = 'newOrg';

const getProfileInfo = (stepProfile, profiles) => {
  if (stepProfile?.isIncognito) {
    const profileLocation = stepProfile.location || {};
    const isEmptyLocation = !profileLocation.address && !profileLocation.country && !profileLocation.structured;
    return {
      name: '', // Can't change name for incognito
      legalName: stepProfile.legalName ?? (profiles[0].legalName || profiles[0].name || ''), // Default to user's legal name
      location: (isEmptyLocation ? profiles[0].location : stepProfile.location) || {}, // Default to user's location
    };
  } else {
    return {
      name: stepProfile?.name || '',
      legalName: stepProfile?.legalName || '',
      location: stepProfile?.location || {},
    };
  }
};

const StepProfileLoggedInForm = ({ profiles, onChange, collective, tier, data, stepDetails }) => {
  const profileInfo = React.useMemo(() => getProfileInfo(data, profiles), [data, profiles]);
  const requiredInformation = React.useMemo(
    () => getRequiredInformation(data, stepDetails, collective, profiles, tier),
    [data, stepDetails, profiles, collective, tier],
  );

  return (
    <Fragment>
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
        <ContributeProfilePicker
          profiles={profiles}
          tier={tier}
          selectedProfile={data}
          onChange={profile => onChange({ stepProfile: profile, stepPayment: null })}
        />
        {requiredInformation.legalName && (
          <React.Fragment>
            {!data?.isIncognito && (
              <StyledInputField
                htmlFor="name"
                label={<FormattedMessage defaultMessage="Your name" id="vlKhIl" />}
                labelFontSize="16px"
                labelFontWeight="700"
                hint={<FormattedMessage defaultMessage="This is your display name or alias." id="kFLEBd" />}
              >
                {inputProps => (
                  <StyledInput
                    {...inputProps}
                    data-cy="input-name"
                    value={profileInfo.name}
                    placeholder="Thomas Anderson"
                    onChange={e => onChange({ stepProfile: { ...data, name: e.target.value } })}
                    maxLength="255"
                  />
                )}
              </StyledInputField>
            )}
            <StyledInputField
              htmlFor="legalName"
              label={<FormattedMessage defaultMessage="Legal name" id="OozR1Y" />}
              required={!profileInfo.name || requiredInformation.legalName}
              hideOptionalLabel={requiredInformation.legalName}
              labelFontSize="16px"
              labelFontWeight="700"
              isPrivate
              hint={
                <FormattedMessage
                  defaultMessage="Required by {isSelfHosted, select, true {{collectiveName}} other {{hostName}, the legal entity that provides {collectiveName} with financial services,}} as total contributions in the current fiscal year exceeds {amount}."
                  id="0FWFFg"
                  values={{
                    amount: formatCurrency(
                      collective.policies.CONTRIBUTOR_INFO_THRESHOLDS.legalName,
                      collective.currency,
                    ),
                    hostName: collective.host.name,
                    collectiveName: collective.name,
                    isSelfHosted: collective.id === collective.host.id,
                  }}
                />
              }
            >
              {inputProps => (
                <StyledInput
                  {...inputProps}
                  data-cy="input-legalName"
                  value={profileInfo.legalName}
                  placeholder={profileInfo.name}
                  onChange={e => onChange({ stepProfile: { ...data, legalName: e.target.value } })}
                  maxLength="255"
                />
              )}
            </StyledInputField>
          </React.Fragment>
        )}
        {requiredInformation.address && (
          <React.Fragment>
            <Flex alignItems="center" mt={2}>
              <P fontSize="24px" lineHeight="32px" fontWeight="500" mr={2}>
                <FormattedMessage id="collective.address.label" defaultMessage="Address" />
              </P>
              <Span mr={2} lineHeight="0">
                <PrivateInfoIcon />
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
                    amount: formatCurrency(
                      collective.policies.CONTRIBUTOR_INFO_THRESHOLDS.address,
                      collective.currency,
                    ),
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
              location={profileInfo.location}
              onChange={value => onChange({ stepProfile: { ...data, location: value } })}
              labelFontSize="16px"
              labelFontWeight="700"
            />
          </React.Fragment>
        )}
      </div>
    </Fragment>
  );
};

StepProfileLoggedInForm.propTypes = {
  data: PropTypes.object,
  stepDetails: PropTypes.object,
  tier: PropTypes.object,
  onChange: PropTypes.func,
  profiles: PropTypes.arrayOf(PropTypes.object),
  collective: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    currency: PropTypes.string,
    host: PropTypes.shape({
      id: PropTypes.string,
      legacyId: PropTypes.number,
      name: PropTypes.string,
      slug: PropTypes.string,
    }),
    policies: PropTypes.shape({
      CONTRIBUTOR_INFO_THRESHOLDS: PropTypes.shape({
        legalName: PropTypes.number,
        address: PropTypes.number,
      }),
    }),
  }),
};

export default StepProfileLoggedInForm;

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Container from '../../components/Container';
import { Box, Flex } from '../../components/Grid';
import { getI18nLink } from '../../components/I18nFormatters';
import InputTypeCountry from '../../components/InputTypeCountry';
import Link from '../../components/Link';
import StyledHr from '../../components/StyledHr';
import StyledInput from '../../components/StyledInput';
import StyledInputField from '../../components/StyledInputField';
import StyledLink from '../../components/StyledLink';
import StyledTextarea from '../../components/StyledTextarea';
import { P } from '../../components/Text';

import StepProfileInfoMessage from './StepProfileInfoMessage';

const NewContributionFlowStepProfileGuestForm = ({ stepDetails, onChange, data }) => {
  const [locale, setLocale] = useState('en');
  const { amount, interval } = stepDetails;

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
                onChange={e => onChange({ stepProfile: { ...data, [e.target.name]: e.target.value } })}
              />
            )}
          </StyledInputField>
        </Box>
        <Box width={1 / 2} mb={3} ml={1}>
          <StyledInputField
            label={<FormattedMessage id="Email" defaultMessage="Email" />}
            htmlFor="email"
            required
            showLabelRequired
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                defaultValue={data?.email}
                placeholder="i.e. tanderson@thematrix.com"
                type="email"
                onChange={e => onChange({ stepProfile: { ...data, [e.target.name]: e.target.value } })}
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
                  fontSize="LeadCaption"
                  onChange={e => onChange({ stepProfile: { ...data, [e.target.name]: e.target.value } })}
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
                    onChange({ stepProfile: { ...data, country: value } });
                  }}
                  value={data?.country}
                />
              )}
            </StyledInputField>
          </Box>
        </Flex>
      )}
      <P fontSize="SmallCaption" color="black.600">
        <FormattedMessage
          id="ContributionFlow.PublicContribution"
          defaultMessage="Your name and contribution will be public."
        />
      </P>
      <StepProfileInfoMessage amount={amount} />
      {interval && (
        <P color="black.500" fontSize="Caption" my={3} data-cy="join-conditions">
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
        <P fontSize="Paragraph" mr={2}>
          <FormattedMessage id="CreateProfile.AlreadyHaveAnAccount" defaultMessage="Already have an account?" />
        </P>
        <Link route={'/signin'} passHref>
          <StyledLink fontSize="Paragraph">
            <FormattedMessage id="signIn" defaultMessage="Sign In" />
            &nbsp;→
          </StyledLink>
        </Link>
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

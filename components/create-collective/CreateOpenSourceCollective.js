import React, { useState } from 'react';
import themeGet from '@styled-system/theme-get';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../../lib/local-storage';

import { Box, Flex } from '../Grid';
import Link from '../Link';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledLink from '../StyledLink';
import { H1, P } from '../Text';

const BackButton = styled(StyledButton)`
  color: ${themeGet('colors.black.600')};
  font-size: 14px;
`;

const messages = defineMessages({
  acceptTermsOfFiscalSponsorship: {
    id: 'createCollective.acceptTermsOfFiscalSponsorship',
    defaultMessage: 'Please accept the terms of fiscal sponsorship',
  },
});

const FISCAL_SPONSOR_TERMS =
  'https://docs.google.com/document/u/1/d/e/2PACX-1vQbiyK2Fe0jLdh4vb9BfHY4bJ1LCo4Qvy0jg9P29ZkiC8y_vKJ_1fNgIbV0p6UdvbcT8Ql1gVto8bf9/pub';

const getGithubConnectUrl = () => {
  const urlParams = new URLSearchParams({ context: 'createCollective' });

  const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  if (accessToken) {
    urlParams.set('access_token', accessToken);
  }

  return `/api/connected-accounts/github?${urlParams.toString()}`;
};

const CreateOpenSourceCollective = () => {
  const { formatMessage } = useIntl();
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState();

  return (
    <Flex flexDirection="column" m={[3, 0]} mb={4}>
      <Flex flexDirection="column" my={[2, 4]}>
        <Box textAlign="left" minHeight="32px" marginLeft={['none', '224px']}>
          <BackButton asLink onClick={() => window && window.history.back()}>
            ←&nbsp;
            <FormattedMessage id="Back" defaultMessage="Back" />
          </BackButton>
        </Box>
        <Box mb={[2, 3]}>
          <H1
            fontSize={['20px', '32px']}
            lineHeight={['24px', '36px']}
            fontWeight="bold"
            textAlign="center"
            color="black.900"
          >
            <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
          </H1>
        </Box>
        <Box textAlign="center" minHeight="24px">
          <P fontSize="16px" color="black.600" mb={2}>
            <FormattedMessage
              id="collective.subtitle.opensource"
              defaultMessage="Open source projects are invited to join the Open Source Collective Fiscal Host."
            />
          </P>
        </Box>
      </Flex>
      {error && (
        <Flex alignItems="center" justifyContent="center">
          <MessageBox type="error" withIcon mb={[1, 3]}>
            {error}
          </MessageBox>
        </Flex>
      )}
      <Flex alignItems="center" justifyContent="center">
        <Box mb={[1, 5]} minWidth={['300px', '576px']} maxWidth={[288, 608, 576]} px={[1, 4]}>
          <P mb={3}>
            <FormattedMessage
              id="createcollective.opensource.p1"
              defaultMessage="You're creating software. You don't want to worry about creating a legal entity or bank account, taxes, invoices, and a bunch of other admin. Let us take care of all that, so you can stay focused on your project."
            />
          </P>
          <P mb={3}>
            <FormattedMessage
              id="createcollective.opensource.p2"
              defaultMessage="We have created the {osclink}, a non-profit umbrella organization, to serve the open source community. To join, you need at least 100 stars on GitHub or to meet our {criterialink}."
              values={{
                osclink: (
                  <StyledLink href="https://opencollective.com/opensource" openInNewTab>
                    Open Source Collective
                  </StyledLink>
                ),
                criterialink: (
                  <StyledLink href="https://www.oscollective.org/#criteria" openInNewTab>
                    <FormattedMessage
                      id="alternativeVerificationCriteria"
                      defaultMessage="alternative verification criteria"
                    />
                  </StyledLink>
                ),
              }}
            />
          </P>
          <P mb={3}>
            <FormattedMessage id="createcollective.opensource.p3" defaultMessage="Fees: 10% of funds raised." />
          </P>
          <P mb={3}>
            <FormattedMessage
              id="createcollective.opensource.p4"
              defaultMessage="Our fees cover operating costs like accounting, payments, tax reporting, invoices, legal liability, use of the Open Collective Platform, and providing support. We also run a range of initiatives to support a sustainable and healthy open source ecosystem. Join us!"
            />
          </P>
          <Box mx={1} my={4}>
            <StyledCheckbox
              name="tos"
              label={
                <FormattedMessage
                  id="createcollective.opensourcetos.label"
                  defaultMessage="I agree with the {toslink}."
                  values={{
                    toslink: (
                      <StyledLink href={FISCAL_SPONSOR_TERMS} openInNewTab>
                        <FormattedMessage id="fiscaltos" defaultMessage="terms of fiscal sponsorship" />
                      </StyledLink>
                    ),
                  }}
                />
              }
              required
              checked={checked}
              onChange={({ checked }) => setChecked(checked)}
            />
          </Box>
          <Flex justifyContent="center" alignItems="center" flexDirection={['column', 'row']}>
            <StyledButton
              mx={2}
              mb={[3, 0]}
              px={[2, 3]}
              textAlign="center"
              fontSize="13px"
              width="196px"
              buttonStyle="primary"
              onClick={() => {
                if (!checked) {
                  setError(formatMessage(messages.acceptTermsOfFiscalSponsorship));
                } else {
                  window.location.href = getGithubConnectUrl();
                }
              }}
            >
              <FormattedMessage
                id="createcollective.opensource.VerifyStars"
                defaultMessage="Verify using GitHub stars"
              />
            </StyledButton>
            <Link
              href={{ pathname: `opensource/apply/form`, query: { hostTos: true } }}
              onClick={e => {
                if (!checked) {
                  e.preventDefault();
                  setError(formatMessage(messages.acceptTermsOfFiscalSponsorship));
                }
              }}
            >
              <StyledButton textAlign="center" fontSize="13px" width="213px" buttonStyle="secondary" mx={2} px={[2, 3]}>
                <FormattedMessage
                  id="createcollective.opensource.ManualVerification"
                  defaultMessage="Request manual verification"
                />
              </StyledButton>
            </Link>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
};

export default CreateOpenSourceCollective;

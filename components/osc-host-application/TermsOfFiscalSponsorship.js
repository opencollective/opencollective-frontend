import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../../lib/local-storage';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex, Grid } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import { H1, P } from '../Text';

import ApplicationDescription from './ApplicationDescription';

const messages = defineMessages({
  acceptTermsOfFiscalSponsorship: {
    id: 'createCollective.acceptTermsOfFiscalSponsorship',
    defaultMessage: 'Please accept the terms of fiscal sponsorship',
  },
});

const FISCAL_SPONSOR_TERMS =
  'https://docs.google.com/document/u/1/d/e/2PACX-1vQbiyK2Fe0jLdh4vb9BfHY4bJ1LCo4Qvy0jg9P29ZkiC8y_vKJ_1fNgIbV0p6UdvbcT8Ql1gVto8bf9/pub';

const getGithubConnectUrl = collectiveSlug => {
  const urlParams = new URLSearchParams({
    context: 'createCollective',
    ...(collectiveSlug ? { CollectiveId: collectiveSlug } : null),
  });

  const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  if (accessToken) {
    urlParams.set('access_token', accessToken);
  }

  return `/api/connected-accounts/github/oauthUrl?${urlParams.toString()}`;
};

const TermsOfFiscalSponsorship = ({ checked, onChecked }) => {
  const { formatMessage } = useIntl();

  const router = useRouter();
  const [error, setError] = useState();

  const { collectiveSlug } = router.query;

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" mt={['24px', '48px']}>
      <Flex flexDirection={['column', 'row']} alignItems="center" justifyContent="center">
        <Box width={'160px'} height={'160px'} mb="24px">
          <NextIllustration
            alt="Open Source Collective logotype"
            src="/static/images/osc-logo.png"
            width={160}
            height={160}
          />
        </Box>
        <Box textAlign={['center', 'left']} width={['288px', '488px']} mb={4} ml={[null, '24px']}>
          <H1
            fontSize="32px"
            lineHeight="40px"
            letterSpacing="-0.008em"
            color="black.900"
            textAlign={['center', 'left']}
            mb="14px"
          >
            <FormattedMessage id="HostApplication.header" defaultMessage="Apply with your Collective" />
          </H1>
          <P fontSize="16px" lineHeight="24px" fontWeight="500" color="black.700">
            <FormattedMessage
              id="collective.subtitle.opensource"
              defaultMessage="Open source projects are invited to join the Open Source Collective Fiscal Host."
            />
          </P>
        </Box>
      </Flex>
      <Box width={['288px', '672px']}>
        <ApplicationDescription />
        <Container display="flex" alignSelf="flex-start" alignItems="center" mb={4} mt={4}>
          <Box mr={3}>
            <StyledCheckbox
              name="TOSAgreement"
              checked={checked}
              onChange={({ checked }) => onChecked(checked)}
              label={
                <P ml={1} fontSize="12px" lineHeight="18px" fontWeight="400">
                  <FormattedMessage
                    id="OCFHostApplication.tosCheckBoxLabel"
                    defaultMessage="I agree with the <TOSLink>terms of fiscal sponsorship</TOSLink>."
                    values={{
                      TOSLink: getI18nLink({
                        href: FISCAL_SPONSOR_TERMS,
                        openInNewTabNoFollow: true,
                        onClick: e => e.stopPropagation(), // don't check the checkbox when clicking on the link
                        color: 'purple.500',
                      }),
                    }}
                  />
                </P>
              }
            />
          </Box>
        </Container>
      </Box>
      <Box width={['288px', '672px']} mb="100px">
        <Grid gridTemplateColumns={['1fr', '1fr 1fr']} gridGap={'32px'} mb={4}>
          <StyledButton
            textAlign="center"
            buttonSize="large"
            buttonStyle="purple"
            onClick={() => {
              if (!checked) {
                setError(formatMessage(messages.acceptTermsOfFiscalSponsorship));
              } else {
                window.location.href = getGithubConnectUrl(collectiveSlug);
              }
            }}
          >
            <FormattedMessage id="createcollective.opensource.VerifyGithub" defaultMessage="Verify using GitHub" />
          </StyledButton>
          <Link
            href={{
              pathname: `/opensource/apply/form`,
              query: { ...(collectiveSlug && { collectiveSlug }) },
            }}
            onClick={e => {
              if (!checked) {
                e.preventDefault();
                setError(formatMessage(messages.acceptTermsOfFiscalSponsorship));
              }
            }}
          >
            <StyledButton textAlign="center" buttonSize="large" buttonStyle="purpleSecondary">
              <FormattedMessage
                id="createcollective.opensource.ManualVerification"
                defaultMessage="Request manual verification"
              />
            </StyledButton>
          </Link>
        </Grid>
        {error && (
          <Flex alignItems="center" justifyContent="center">
            <MessageBox type="error" withIcon mb={[1, 3]}>
              {error}
            </MessageBox>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};

TermsOfFiscalSponsorship.propTypes = {
  checked: PropTypes.bool,
  onChecked: PropTypes.func,
};

export default TermsOfFiscalSponsorship;

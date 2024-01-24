import React from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import { defineMessages, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { getCollectivePageRoute } from '../../lib/url-helpers';

import Newsletter from '../collectives/Newsletter';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import StyledLink from '../StyledLink';
import { H3, P, Span } from '../Text';

export const SUCCESS_CTA_TYPE = {
  NEWSLETTER: 'NEWSLETTER',
  BLOG: 'BLOG',
  JOIN: 'JOIN',
  SIGN_IN: 'SIGN_IN',
  GO_TO_PROFILE: 'GO_TO_PROFILE',
};

const headerMessages = defineMessages({
  [SUCCESS_CTA_TYPE.JOIN]: {
    id: 'collective.create.join',
    defaultMessage: 'Join Open Collective',
  },
  [SUCCESS_CTA_TYPE.SIGN_IN]: {
    id: 'signIn',
    defaultMessage: 'Sign In',
  },
  [SUCCESS_CTA_TYPE.BLOG]: {
    id: 'ReadOurStories',
    defaultMessage: 'Read our stories',
  },
  [SUCCESS_CTA_TYPE.NEWSLETTER]: {
    id: 'NewContributionFlow.Success.CTA.Newsletter.Header',
    defaultMessage: 'Subscribe to the Open{nbsp}Collective newsletter',
  },
  [SUCCESS_CTA_TYPE.GO_TO_PROFILE]: {
    defaultMessage: "Go to {accountName}'s page",
    id: 'iPy92R',
  },
});

const contentMessages = defineMessages({
  [SUCCESS_CTA_TYPE.JOIN]: {
    id: 'NewContributionFlow.Success.CTA.Join.Content',
    defaultMessage: 'Create an account and show all your contributions.',
  },
  [SUCCESS_CTA_TYPE.SIGN_IN]: {
    id: 'NewContributionFlow.Success.CTA.SignIn.Content',
    defaultMessage: 'Sign in with your Open Collective account to edit your profile and manage your contributions.',
  },
  [SUCCESS_CTA_TYPE.BLOG]: {
    id: 'NewContributionFlow.Success.CTA.Read.Content',
    defaultMessage:
      "Open Collective aims to foster transparency and sustainability in communities around the world. Here's how you can participate.",
  },
  [SUCCESS_CTA_TYPE.NEWSLETTER]: {
    id: 'home.joinUsSection.weNeedUpdate',
    defaultMessage: 'We send updates once a month.',
  },
  [SUCCESS_CTA_TYPE.GO_TO_PROFILE]: {
    defaultMessage: 'Go to the public page of {accountName} on Open Collective',
    id: '/aBz/1',
  },
});

const CTAContainer = styled(Container)`
  display: flex;
  justify-content: space-between;
  border: 1px solid ${themeGet('colors.black.400')};
  border-radius: 10px;
  background-color: white;

  ${props =>
    props.$isPrimary &&
    css`
      border: 1px solid ${themeGet('colors.primary.500')};

      h3,
      span {
        color: ${themeGet('colors.primary.800')};
        word-break: break-word;
      }
    `}

  ${props =>
    props.hoverable &&
    css`
      &:hover {
        border: 1px solid ${themeGet('colors.primary.500')};
        cursor: pointer;

        h3,
        span {
          color: ${themeGet('colors.primary.800')};
        }
      }
    `}
`;

const SuccessCTAWrapper = ({ type, orderId, email, account, ...props }) => {
  switch (type) {
    case SUCCESS_CTA_TYPE.JOIN:
      return (
        <StyledLink
          display="block"
          data-cy="join-opencollective-link"
          href={{ pathname: '/create-account/guest', query: { OrderId: orderId, email } }}
          color="black.800"
          {...props}
        />
      );
    case SUCCESS_CTA_TYPE.SIGN_IN:
      return (
        <StyledLink
          display="block"
          color="black.800"
          data-cy="success-signin-link"
          href={{ pathname: '/signin', query: { email } }}
          {...props}
        />
      );
    case SUCCESS_CTA_TYPE.BLOG:
      return <StyledLink href="https://blog.opencollective.com" openInNewTab color="black.800" {...props} />;
    case SUCCESS_CTA_TYPE.GO_TO_PROFILE:
      return <StyledLink href={getCollectivePageRoute(account)} color="black.800" {...props} />;
    default:
      return <React.Fragment {...props} />;
  }
};

SuccessCTAWrapper.propTypes = {
  type: PropTypes.string,
  orderId: PropTypes.string,
  email: PropTypes.string,
  account: PropTypes.object,
};

const SuccessCTA = ({ type, orderId, email, account, isPrimary }) => {
  const { formatMessage } = useIntl();
  const isNewsletter = type === SUCCESS_CTA_TYPE.NEWSLETTER;
  return (
    <Container px={[3, 0]} my={3} maxWidth={600}>
      <SuccessCTAWrapper account={account} type={type} orderId={orderId} email={email}>
        <CTAContainer px={4} py={2} hoverable={!isNewsletter} $isPrimary={isPrimary}>
          <Flex
            flexDirection="column"
            alignItems="left"
            justifyContent="center"
            width={[isNewsletter ? 1 : 4 / 5, 4 / 5]}
            my={3}
          >
            <H3 mb={3} color="black.800">
              {formatMessage(headerMessages[type], {
                accountName: account.name,
                nbsp: <React.Fragment>&nbsp;</React.Fragment>,
              })}
            </H3>
            <P fontSize="14px" lineHeight="24px" fontWeight={300} color="black.700">
              {formatMessage(contentMessages[type], { accountName: account.name })}
            </P>
            {isNewsletter && (
              <Box mt={2}>
                <Newsletter defaultEmail={email} />
              </Box>
            )}
          </Flex>
          {!isNewsletter && (
            <Flex alignItems="center" justifyContent="center">
              <Span fontSize={40}>&rarr;</Span>
            </Flex>
          )}
        </CTAContainer>
      </SuccessCTAWrapper>
    </Container>
  );
};

SuccessCTA.propTypes = {
  type: PropTypes.oneOf(Object.values(SUCCESS_CTA_TYPE)).isRequired,
  orderId: PropTypes.string,
  email: PropTypes.string,
  isPrimary: PropTypes.bool,
  account: PropTypes.shape({
    name: PropTypes.string,
    slug: PropTypes.string,
  }).isRequired,
};

export default SuccessCTA;

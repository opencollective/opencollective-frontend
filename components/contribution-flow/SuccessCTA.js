import React from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import { defineMessages, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Newsletter from '../home/Newsletter';
import Link from '../Link';
import StyledLink from '../StyledLink';
import { H3, P, Span } from '../Text';

export const SUCCESS_CTA_TYPE = {
  NEWSLETTER: 'NEWSLETTER',
  BLOG: 'BLOG',
  JOIN: 'JOIN',
  SIGN_IN: 'SIGN_IN',
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
    id: 'home.joinUsSection.newsletter',
    defaultMessage: 'Subscribe to our newsletter',
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
});

const CTAContainer = styled(Container)`
  display: flex;
  justify-content: space-between;
  border: 1px solid ${themeGet('colors.black.400')};
  border-radius: 10px;
  background-color: white;

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

const SuccessCTAWrapper = ({ type, orderId, email, ...props }) => {
  switch (type) {
    case SUCCESS_CTA_TYPE.JOIN:
      return (
        <StyledLink
          as={Link}
          display="block"
          data-cy="join-opencollective-link"
          href="/create-account/guest"
          color="black.800"
          params={{ OrderId: orderId, email }}
          {...props}
        />
      );
    case SUCCESS_CTA_TYPE.SIGN_IN:
      return (
        <StyledLink
          as={Link}
          display="block"
          color="black.800"
          data-cy="success-signin-link"
          href="/signin"
          params={{ email }}
          {...props}
        />
      );
    case SUCCESS_CTA_TYPE.BLOG:
      return <StyledLink href="https://blog.opencollective.com" openInNewTab color="black.800" {...props} />;
    default:
      return <React.Fragment {...props} />;
  }
};

SuccessCTAWrapper.propTypes = {
  type: PropTypes.string,
  orderId: PropTypes.string,
  email: PropTypes.string,
};

const SuccessCTA = ({ type, orderId, email }) => {
  const { formatMessage } = useIntl();
  const isNewsletter = type === SUCCESS_CTA_TYPE.NEWSLETTER;
  return (
    <Container px={[3, 0]} my={3} maxWidth={600}>
      <SuccessCTAWrapper type={type} orderId={orderId} email={email}>
        <CTAContainer px={4} py={2} hoverable={!isNewsletter}>
          <Flex
            flexDirection="column"
            alignItems="left"
            justifyContent="center"
            width={[isNewsletter ? 1 : 4 / 5, 4 / 5]}
            my={3}
          >
            <H3 mb={3} color="black.800">
              {formatMessage(headerMessages[type])}
            </H3>
            <P fontSize="14px" lineHeight="24px" fontWeight={300} color="black.700">
              {formatMessage(contentMessages[type])}
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
  type: PropTypes.oneOf(Object.values(SUCCESS_CTA_TYPE)),
  orderId: PropTypes.string,
  email: PropTypes.string,
};

export default SuccessCTA;

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';

import { PaperPlane } from '@styled-icons/boxicons-regular/PaperPlane';

import Container from '../components/Container';
import Page from '../components/Page';
import { H3, P } from '../components/Text';
import OpenEmailProviderButton from '../components/OpenEmailProviderButton';

const Icon = styled(PaperPlane)`
  color: ${themeGet('colors.primary.300')};
`;

class SignInLinkSent extends Component {
  static async getInitialProps({ res, query = {}, router }) {
    if (query.email) {
      return { email: query.email };
    }

    if (res) {
      res.statusCode = 302;
      res.setHeader('Location', '/signin');
      res.end();
    } else {
      router.pushRoute('signin');
    }
    return {};
  }

  render() {
    const { email } = this.props;

    return (
      <Page title="Login Link Sent">
        <Container pt={[4, 5]} pb={6} px={2} background="linear-gradient(180deg, #EBF4FF, #FFFFFF)" textAlign="center">
          <Flex justifyContent="center" mb={4}>
            <Icon size="60" />
          </Flex>
          <H3 as="h1" fontWeight="800">
            <FormattedMessage id="SignIn.LinkSent" defaultMessage="Your magic link is on its way!" />
          </H3>
          <P fontSize="LeadParagraph" lineHeight="LeadParagraph" color="black.900" mt={4}>
            <FormattedMessage
              id="SignIn.SentTo"
              defaultMessage="We've sent it to {email}."
              values={{ email: <strong>{email}</strong> }}
            />
          </P>
          <P color="black.700" mt={3}>
            <FormattedMessage
              id="SignIn.SuccessDetails"
              defaultMessage="You’ll be redirected from the link in the email, you can safely close this tab."
            />
          </P>
          <OpenEmailProviderButton email={email}>{button => <Box mt={3}>{button}</Box>}</OpenEmailProviderButton>
        </Container>
      </Page>
    );
  }
}

SignInLinkSent.propTypes = {
  email: PropTypes.string.isRequired,
};

export default SignInLinkSent;

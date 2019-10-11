import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';

import { Flex } from '@rebass/grid';
import Container from '../components/Container';
import Page from '../components/Page';
import { H3, P } from '../components/Text';
import { PaperPlane } from 'styled-icons/boxicons-regular/PaperPlane';
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
        <Container pt={4} pb={6} px={2} background="linear-gradient(180deg, #EBF4FF, #FFFFFF)" textAlign="center">
          <Flex justifyContent="center" mb={4}>
            <Icon size="60" />
          </Flex>
          <H3 as="h1" fontWeight="800">
            Your magic link is on its way!
          </H3>
          <P fontSize="LeadParagraph" lineHeight="LeadParagraph" color="black.900" mt={4}>
            We&apos;ve sent it to <strong>{email}</strong>.
          </P>

          <P color="black.700" mt={3}>
            You&apos;ll be automatically redirected to the page before signing in. You can close this tab.
          </P>
          <P>
            <OpenEmailProviderButton email={email} />
          </P>
        </Container>
      </Page>
    );
  }
}

SignInLinkSent.propTypes = {
  email: PropTypes.string.isRequired,
};

export default SignInLinkSent;

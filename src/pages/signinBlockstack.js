import { Component } from 'react';
import styled from 'styled-components';
import { themeGet } from 'styled-system';
import PropTypes from 'prop-types';

import { Flex } from '@rebass/grid';
import Container from '../components/Container';
import Page from '../components/Page';
import { H3 } from '../components/Text';
import { PaperPlane } from 'styled-icons/boxicons-regular/PaperPlane';
import * as blockstack from '../lib/blockstack';

const Icon = styled(PaperPlane)`
  color: ${themeGet('colors.primary.300')};
`;

class SignInBlockstack extends Component {
  static async getInitialProps({ res, query = {}, router }) {
    if (query.authResponse) {
      return blockstack
        .createUserSession()
        .handlePendingSignIn(query.authResponse)
        .then(userProfile => {
          userProfile;
        });
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
    const { userProfile } = this.props;
    return (
      <Page title="Blockstack Login Successful">
        <Container pt={4} pb={6} px={2} background="linear-gradient(180deg, #EBF4FF, #FFFFFF)" textAlign="center">
          <Flex justifyContent="center" mb={4}>
            <Icon size="60" />
          </Flex>
          <H3 as="h1" fontWeight="800">
            Your Blockstack ID is {userProfile.username}
          </H3>
        </Container>
      </Page>
    );
  }
}

SignInBlockstack.propTypes = {
  userProfile: PropTypes.object.isRequired,
};

export default SignInBlockstack;

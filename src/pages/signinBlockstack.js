import React from 'react';
import styled from 'styled-components';
import { themeGet } from 'styled-system';
import PropTypes from 'prop-types';

import { Flex } from '@rebass/grid';
import Container from '../components/Container';
import Page from '../components/Page';
import { H3 } from '../components/Text';
import { User } from 'styled-icons/boxicons-regular/User';
import { createUserSession } from '../lib/blockstack';
import { checkUserExistence, signin } from '../lib/api';
import { getPublicKeyFromPrivate, decryptContent } from 'blockstack';
import { Router } from '../server/pages';
import { createUserQuery } from '../graphql/mutations';
import { graphql } from 'react-apollo';

const Icon = styled(User)`
  color: ${themeGet('colors.primary.300')};
`;

class SignInBlockstack extends React.Component {
  static async getInitialProps({ res, query = {}, router }) {
    if (query.authResponse) {
      return { authResponse: query.authResponse };
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

  state = {
    userData: null,
    exists: false,
  };

  async componentWillMount() {
    const userSession = createUserSession();
    userSession.handlePendingSignIn(this.props.authResponse).then(userData => {
      this.setState({ userData });
      checkUserExistence(userData.email).then(exists => {
        this.setState({ exists });
        const publicKey = getPublicKeyFromPrivate(userData.appPrivateKey);
        if (exists) {
          const user = { email: userData.email, publicKey };
          signin(user).then(async response => {
            if (response.encryptedRedirect) {
              const link = decryptContent(response.encryptedRedirect);
              await Router.replaceRoute(link);
            } else {
              this.setState({ error: 'Failed to signin' });
            }
          });
        } else {
          const firstName = userData.username;
          const lastName = userData.profile.name;
          this.propse.createUser({ email: userData.email, firstName, lastName, publicKey }).then(async response => {
            if (response.encryptedRedirect) {
              const link = decryptContent(response.encryptedRedirect);
              await Router.replaceRoute(link);
            } else {
              this.setState({ error: 'Failed to create profile' });
            }
          });
        }
      });
    });
  }

  render() {
    const { userData, exists } = this.state;
    return (
      <Page title="Blockstack Login Successful">
        <Container pt={4} pb={6} px={2} background="linear-gradient(180deg, #EBF4FF, #FFFFFF)" textAlign="center">
          <Flex justifyContent="center" mb={4}>
            <Icon size="60" />
          </Flex>
          <H3 as="h1" fontWeight="800">
            {userData && <>{userData.username}</>}
            {exists && (
              <>
                <br />
                You have already a profile
              </>
            )}
            {exists && (
              <>
                <br />
                ... creating your profile ...
              </>
            )}
          </H3>
        </Container>
      </Page>
    );
  }
}

SignInBlockstack.propTypes = {
  authResponse: PropTypes.string.isRequired,
  createUser: PropTypes.func,
};

const addCreateUserMutation = graphql(createUserQuery, {
  props: ({ mutate }) => ({
    createUser: variables => mutate({ variables }),
  }),
});

export default addCreateUserMutation(SignInBlockstack);

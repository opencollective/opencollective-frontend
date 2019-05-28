import React from 'react';
import styled from 'styled-components';
import { themeGet } from 'styled-system';
import PropTypes from 'prop-types';

import { Flex } from '@rebass/grid';
import Container from '../components/Container';
import Page from '../components/Page';
import Error from '../components/Error';

import { H3 } from '../components/Text';
import { User } from 'styled-icons/boxicons-regular/User';
import { createUserSession } from '../lib/blockstack';
import { checkResponseStatus } from '../lib/api';
import { isValidEmail, getWebsiteUrl } from '../lib/utils';
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
      let organizationData;
      if (query.org) {
        organizationData = JSON.parse(query.org);
      } else {
        organizationData = null;
      }
      if (organizationData) {
        organizationData.name = organizationData.orgName;
        delete organizationData.orgName;
      }
      let next;
      if (query.next) {
        next = query.next.replace(/'/g, '');
      } else {
        next = null;
      }
      return { authResponse: query.authResponse, next, organizationData };
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
    loading: true,
  };

  async componentWillMount() {
    const userSession = createUserSession();
    const redirect = this.props.next || '/';
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn(this.props.authResponse).then(userData => {
        this.setState({ userData });
        const publicKey = getPublicKeyFromPrivate(userData.appPrivateKey);
        this.checkUserExistence(userData.email, publicKey).then(exists => {
          this.setState({ exists, loading: false });

          if (exists) {
            const user = { email: userData.email, publicKey };
            this.signin(user, redirect).then(async response => {
              if (response.redirect) {
                const link = decryptContent(response.redirect, { privateKey: userData.appPrivateKey });
                await Router.replaceRoute(link);
              } else {
                this.setState({ error: 'Failed to signin' });
              }
            });
          } else {
            const firstName = userData.username;
            const lastName = userData.profile.name;
            const organization = this.props.organizationData;
            this.props
              .createUser({ user: { email: userData.email, firstName, lastName, publicKey }, organization, redirect })
              .then(async response => {
                if (response.redirect) {
                  const link = decryptContent(response.redirect, { privateKey: userData.appPrivateKey });
                  await Router.replaceRoute(link);
                } else {
                  this.setState({ error: 'Failed to create profile' });
                }
              });
          }
        });
      });
    } else if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      this.setState({ userData, loading: false });
      await Router.replaceRoute(redirect);
    } else {
      this.setState({ loading: false });
      await Router.replaceRoute(`/signin?next='${redirect}'`);
    }
  }

  checkUserExistence(email, publicKey) {
    if (!isValidEmail(email)) return Promise.resolve(false);
    return fetch(
      `/api/users/exists-with-public-key?email=${encodeURIComponent(email)}&publicKey=${encodeURIComponent(publicKey)}`,
    )
      .then(checkResponseStatus)
      .then(json => Boolean(json.exists));
  }

  signin(user, redirect) {
    const websiteUrl = getWebsiteUrl();
    return fetch('/api/users/signin-public-key', {
      method: 'POST',
      headers: {
        ...this.addAuthTokenToHeader(),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user, redirect, websiteUrl }),
    }).then(checkResponseStatus);
  }

  addAuthTokenToHeader(obj = {}) {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return obj;
    return {
      Authorization: `Bearer ${accessToken}`,
      ...obj,
    };
  }

  render() {
    const { userData, exists, loading, error } = this.state;
    return (
      <Page title="Blockstack Login Successful">
        <Container pt={4} pb={6} px={2} background="linear-gradient(180deg, #EBF4FF, #FFFFFF)" textAlign="center">
          <Flex justifyContent="center" mb={4}>
            <Icon size="60" />
          </Flex>
          <H3 as="h1" fontWeight="800">
            {userData && <>{userData.username}</>}
            {loading && (
              <>
                <br />
                ... stacking blocks ...
              </>
            )}
            {!loading && exists && (
              <>
                <br />
                You have already a profile. Signing in ...
              </>
            )}
            {!loading && !exists && (
              <>
                <br />
                ... creating your profile ...
              </>
            )}
          </H3>
          {error && <Error message={error} />}
        </Container>
      </Page>
    );
  }
}

SignInBlockstack.propTypes = {
  authResponse: PropTypes.string.isRequired,
  next: PropTypes.string,
  organizationData: PropTypes.object,
  createUser: PropTypes.func,
};

const addCreateUserMutation = graphql(createUserQuery, {
  props: ({ mutate }) => ({
    createUser: variables => mutate({ variables }),
  }),
});

export default addCreateUserMutation(SignInBlockstack);

import React from 'react';
import styled from 'styled-components';
import { themeGet } from 'styled-system';
import PropTypes from 'prop-types';

import { Flex } from '@rebass/grid';
import Container from '../components/Container';
import Page from '../components/Page';
import Error from '../components/Error';

import { H3, P } from '../components/Text';
import { User } from 'styled-icons/boxicons-regular/User';
import { createUserSession } from '../lib/blockstack';
import { checkResponseStatus, checkUserExistence as checkEmailExistence } from '../lib/api';
import { isValidEmail, getWebsiteUrl } from '../lib/utils';
import { getPublicKeyFromPrivate, decryptContent } from 'blockstack';
import { Router } from '../server/pages';
import { createUserByPublicKeyQuery, addUpdateUserPublicKeyMutation } from '../graphql/mutations';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import { withUser } from '../components/UserProvider';
import StyledButton from '../components/StyledButton';

const Icon = styled(User)`
  color: ${themeGet('colors.primary.300')};
`;

class SignInBlockstack extends React.Component {
  static async getInitialProps({ query = {} }) {
    if (query.authResponse) {
      let organizationData;
      if (query.org) {
        organizationData = JSON.parse(query.org);
        if (!organizationData.orgName || organizationData.orgName.length === 0) {
          organizationData = null;
        }
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
    } else {
      // TODO hanlde redirect after signin with magic link
      const next = '/';
      return { next };
    }
  }

  state = {
    userData: null,
    exists: false,
    existsEmail: false,
    loading: true,
    newPublicKey: null,
    isUpdatingPublicKey: false,
    wasPublicKeyUpdated: false,
  };

  async componentDidMount() {
    this.loadInitialState();
  }

  componentDidUpdate(oldProps) {
    if (
      oldProps.LoggedInUser !== this.props.LoggedInUser ||
      oldProps.loadingLoggedInUser !== this.props.loadingLoggedInUser
    ) {
      this.loadInitialState();
    }
  }

  async loadInitialState() {
    // eslint-disable-next-line no-console
    console.log('loadInitialState');
    const userSession = createUserSession();
    const redirect = this.props.next || '/';
    if (userSession.isSignInPending()) {
      const userData = await userSession.handlePendingSignIn(this.props.authResponse);
      this.setState({ userData });
      const publicKey = getPublicKeyFromPrivate(userData.appPrivateKey);
      const exists = await this.checkUserExistence(userData.email, publicKey);
      if (exists) {
        this.setState({ exists, loading: false });
        this.signinPublicKey(userData, publicKey, redirect);
      } else {
        const existsEmail = await checkEmailExistence(userData.email);
        this.setState({ exists, existsEmail, loading: false });
        if (existsEmail) {
          this.signinEmail(userData, publicKey, redirect);
        } else {
          this.createUser(userData, publicKey, redirect);
        }
      }
    } else if (userSession.isUserSignedIn()) {
      if (!this.props.loadingLoggedInUser && this.props.LoggedInUser) {
        await this.props.updateUserPublicKey('x');

        const userData = userSession.loadUserData();
        const publicKey = getPublicKeyFromPrivate(userData.appPrivateKey);
        if (this.props.LoggedInUser.publicKey !== publicKey) {
          this.setState({ newPublicKey: publicKey, userData, loading: false });
        } else {
          await Router.replaceRoute(redirect);
        }
      } else if (!this.props.loadingLoggedInUser && !this.props.LoggedInUser) {
        // login did not work
        this.setState({ redirectingToSignIn: true, loading: false });
        await Router.replaceRoute(`/signin?next='${redirect}'`);
      }
    } else {
      this.setState({ redirectingToSignIn: true, loading: false });
      await Router.replaceRoute(`/signin?next='${redirect}'`);
    }
  }

  async createUser(userData, publicKey, redirect) {
    const firstName = userData.username;
    const lastName = userData.profile.name;
    const organization = this.props.organizationData;
    try {
      const response = await this.props.createUser({
        user: { email: userData.email, firstName, lastName, publicKey },
        organization,
        redirect,
      });
      if (response.data && response.data.createUserByPublicKey && response.data.createUserByPublicKey.redirect) {
        const link = decryptContent(response.data.createUserByPublicKey.redirect, {
          privateKey: userData.appPrivateKey,
        });
        await Router.replaceRoute(link);
      } else {
        this.setState({ error: 'Failed to create profile' });
      }
    } catch (error) {
      this.setState({ error: 'Failed to create profile' });
    }
  }

  async signinPublicKey(userData, publicKey, redirect) {
    const user = { email: userData.email, publicKey };
    try {
      const response = await this.signinPublicKeyPost(user, redirect);

      if (response.redirect) {
        const link = decryptContent(response.redirect, { privateKey: userData.appPrivateKey });
        await Router.replaceRoute(link);
      } else {
        this.setState({ error: 'Failed to signin' });
      }
    } catch (error) {
      this.setState({ error: `Failed to signin, ${error}` });
    }
  }

  signinEmail(userData, publicKey, redirect) {
    const user = { email: userData.email, publicKey };
    this.signinEmailPost(user, `/blockstack/${encodeURIComponent(redirect)}`).catch(error => {
      this.setState({ error: `Failed to signin, ${error}` });
    });
  }

  checkUserExistence(email, publicKey) {
    if (!isValidEmail(email)) return Promise.resolve(false);
    return fetch(
      `/api/users/exists-with-public-key?email=${encodeURIComponent(email)}&publicKey=${encodeURIComponent(publicKey)}`,
    )
      .then(checkResponseStatus)
      .then(json => Boolean(json.exists));
  }

  signinPublicKeyPost(user, redirect) {
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

  signinEmailPost(user, redirect) {
    const websiteUrl = getWebsiteUrl();
    return fetch('/api/users/signin', {
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

  async connectBlockstackWithProfile() {
    const { newPublicKey } = this.state;
    const { updateUserPublicKey, next } = this.props;
    this.setState({ isUpdatingPublicKey: true });
    try {
      const { data } = await updateUserPublicKey(newPublicKey);
      const wasPublicKeyUpdated = data.updateUserPublicKey.publicKey === newPublicKey;
      this.setState({ isUpdatingPublicKey: false, wasPublicKeyUpdated });
      if (wasPublicKeyUpdated) {
        await Router.replaceRoute(next || '/');
      }
    } catch (e) {
      this.setState({ error: e.message.replace('GraphQL error: ', ''), isUpdatingPublicKey: false });
    }
  }

  render() {
    const {
      userData,
      exists,
      existsEmail,
      newPublicKey,
      loading,
      error,
      redirectingToSignIn,
      isUpdatingPublicKey,
      wasPublicKeyUpdated,
    } = this.state;
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
                ...
                <FormattedMessage id="blockstack.loading" defaultMessage="stacking blocks" />
                ...
              </>
            )}
            {!loading && exists && (
              <>
                <br />
                <FormattedMessage
                  id="blockstack.profileExistsSignIn"
                  defaultMessage="You have already a profile. Signing in ..."
                />
              </>
            )}
            {!loading && !exists && existsEmail && (
              <>
                <br />
                <FormattedMessage id="blockstack.profileExists" defaultMessage="You have already a profile." />
                <br />
              </>
            )}
            {!loading && !exists && !existsEmail && !newPublicKey && !redirectingToSignIn && (
              <>
                <br />
                ... <FormattedMessage id="blockstack.creatingProfile" defaultMessage="creating your profile" />
                ...
              </>
            )}
          </H3>
          {!loading && !exists && existsEmail && (
            <>
              <br />
              <FormattedMessage
                id="blockstack.signinToConnect"
                defaultMessage="Please sign in with the magic link to connect your blockstack id to your profile."
              />
              <br />
              <H3 as="h1" fontWeight="800">
                <FormattedMessage id="signin.magicLinkSent" defaultMessage="Your magic link is on its way!" />
              </H3>
              <P fontSize="LeadParagraph" lineHeight="LeadParagraph" color="black.900" mt={4}>
                <FormattedMessage
                  id="signin.linkSentToEmail"
                  defaultMessage="We've sent it to {email}"
                  values={{ email: <strong>{userData.email}</strong> }}
                />
                .
              </P>
            </>
          )}

          {newPublicKey && (
            <StyledButton
              minWidth={180}
              loading={isUpdatingPublicKey}
              disabled={wasPublicKeyUpdated}
              mr={2}
              onClick={async () => {
                this.connectBlockstackWithProfile();
              }}
            >
              <FormattedMessage
                id="ConnectBlockstack.connect"
                defaultMessage="Use this Blockstack ID with your Open Collective profile"
              />
            </StyledButton>
          )}
          {error && <Error message={error} />}
        </Container>
      </Page>
    );
  }
}

SignInBlockstack.propTypes = {
  authResponse: PropTypes.string,
  next: PropTypes.string,
  organizationData: PropTypes.object,
  createUser: PropTypes.func,
  LoggedInUser: PropTypes.object, // from withUser
  loadingLoggedInUser: PropTypes.bool, // from withUser
  updateUserPublicKey: PropTypes.func, // from addUpdateUserPublicKeyMutation
};

const addCreateUserMutation = graphql(createUserByPublicKeyQuery, {
  props: ({ mutate }) => ({
    createUser: variables => mutate({ variables }),
  }),
});

export default addUpdateUserPublicKeyMutation(addCreateUserMutation(withIntl(withUser(SignInBlockstack))));

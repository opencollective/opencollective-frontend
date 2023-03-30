import React, { Fragment } from 'react';
import { PropTypes } from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get, pick } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';
import { isEmail } from 'validator';

import { signin } from '../lib/api';
import { i18nGraphqlException } from '../lib/errors';
import { gqlV1 } from '../lib/graphql/helpers';
import { getWebsiteUrl } from '../lib/utils';

import Container from './Container';
import CreateProfile from './CreateProfile';
import { Box, Flex } from './Grid';
import Link from './Link';
import Loading from './Loading';
import SignIn from './SignIn';
import StyledHr from './StyledHr';
import { Span } from './Text';
import { TOAST_TYPE, withToasts } from './ToastProvider';
import { withUser } from './UserProvider';

const SignInFooterLink = styled(Link)`
  color: #323334;
  font-size: 13px;
  font-weight: 400;
  &:hover {
    text-decoration: underline;
  }
`;

export const SignInOverlayBackground = styled(Container)`
  padding: 25px;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 9px 14px 1px #dedede;
`;

/**
 * Shows a SignIn form by default, with the ability to switch to SignUp form. It
 * also has the API methods binded, so you can use it directly.
 */
class SignInOrJoinFree extends React.Component {
  static propTypes = {
    /** Redirect URL */
    redirect: PropTypes.string,
    /** To pre-fill the "email" field */
    defaultEmail: PropTypes.string,
    /** Provide this to automatically sign in the given email */
    email: PropTypes.string,
    /** createUserQuery binding */
    createUser: PropTypes.func,
    /** Whether user can signup from there */
    disableSignup: PropTypes.bool,
    /** Use this prop to use this as a controlled component */
    form: PropTypes.oneOf(['signin', 'create-account']),
    /** Set the initial view for the component */
    defaultForm: PropTypes.oneOf(['signin', 'create-account']),
    /** If provided, component will use links instead of buttons to make the switch */
    routes: PropTypes.shape({
      signin: PropTypes.string,
      join: PropTypes.string,
    }),
    /** Label for signIn, defaults to "Continue with your email" */
    signInLabel: PropTypes.node,
    intl: PropTypes.object,
    router: PropTypes.object,
    addToast: PropTypes.func.isRequired,
    hideFooter: PropTypes.bool,
    isOAuth: PropTypes.bool,
    showSubHeading: PropTypes.bool,
    showOCLogo: PropTypes.bool,
    oAuthApplication: PropTypes.shape({
      name: PropTypes.string,
      account: PropTypes.shape({
        imageUrl: PropTypes.string,
      }),
    }),
    /* From UserProvider / withUser */
    login: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      form: this.props.defaultForm || 'signin',
      error: null,
      submitting: false,
      unknownEmailError: false,
      email: props.email || props.defaultEmail || '',
      emailAlreadyExists: false,
      isOAuth: this.props.isOAuth,
      oAuthAppName: this.props.oAuthApplication?.name,
      oAuthAppImage: this.props.oAuthApplication?.account?.imageUrl,
    };
  }

  componentDidMount() {
    // Auto signin if an email is provided
    if (this.props.email && isEmail(this.props.email)) {
      this.signIn(this.props.email);
    }
  }

  switchForm = (form, oAuthDetails = {}) => {
    // Update local state
    this.setState({
      form,
      isOAuth: oAuthDetails.isOAuth,
      oAuthAppName: oAuthDetails.oAuthAppName,
      oAuthAppImage: oAuthDetails.oAuthAppImage,
    });
  };

  getRedirectURL() {
    let currentPath = window.location.pathname;
    if (window.location.search) {
      currentPath = currentPath + window.location.search;
    }
    let redirectUrl = this.props.redirect;
    if (currentPath.includes('/create-account') && redirectUrl === '/') {
      redirectUrl = '/welcome';
    }
    return encodeURIComponent(redirectUrl || currentPath || '/');
  }

  signIn = async (email, password = null, { sendLink = false, resetPassword = false } = {}) => {
    if (this.state.submitting) {
      return false;
    }

    this.setState({ submitting: true, error: null });

    try {
      const response = await signin({
        user: { email, password },
        redirect: this.getRedirectURL(),
        websiteUrl: getWebsiteUrl(),
        sendLink,
        resetPassword,
        createProfile: false,
      });

      // In dev/test, API directly returns a redirect URL for emails like
      // test*@opencollective.com.
      if (response.redirect) {
        await this.props.router.replace(response.redirect);
      } else if (response.token) {
        const user = await this.props.login(response.token);
        if (!user) {
          this.setState({ error: 'Token rejected' });
        }
      } else if (resetPassword) {
        await this.props.router.push({ pathname: '/reset-password/sent', query: { email } });
      } else {
        await this.props.router.push({ pathname: '/signin/sent', query: { email } });
      }
      window.scrollTo(0, 0);
    } catch (e) {
      if (e.json?.errorCode === 'EMAIL_DOES_NOT_EXIST') {
        this.setState({ unknownEmailError: true, submitting: false });
      } else if (e.json?.errorCode === 'PASSWORD_REQUIRED') {
        this.setState({ passwordRequired: true, submitting: false });
      } else if (e.message?.includes('Two-factor authentication is enabled')) {
        this.setState({ submitting: false });
      } else {
        this.props.addToast({
          type: TOAST_TYPE.ERROR,
          message: e.message || 'Server error',
        });
        this.setState({ submitting: false });
      }
    }
  };

  createProfile = async data => {
    if (this.state.submitting) {
      return false;
    }
    const user = pick(data, ['email', 'name', 'legalName', 'newsletterOptIn']);
    const organizationData = pick(data, ['orgName', 'orgLegalName', 'githubHandle', 'twitterHandle', 'website']);
    const organization = Object.keys(organizationData).length > 0 ? organizationData : null;
    if (organization) {
      organization.name = organization.orgName;
      organization.legalName = organization.orgLegalName;
      delete organization.orgName;
      delete organization.orgLegalName;
    }

    this.setState({ submitting: true, error: null });

    try {
      await this.props.createUser({
        variables: {
          user,
          organization,
          redirect: this.getRedirectURL(),
          websiteUrl: getWebsiteUrl(),
        },
      });
      await this.props.router.push({ pathname: '/signin/sent', query: { email: user.email } });
      window.scrollTo(0, 0);
    } catch (error) {
      const emailAlreadyExists = get(error, 'graphQLErrors.0.extensions.code') === 'EMAIL_ALREADY_EXISTS';
      if (!emailAlreadyExists) {
        this.props.addToast({
          type: TOAST_TYPE.ERROR,
          message: i18nGraphqlException(this.props.intl, error),
        });
      }
      this.setState({ submitting: false, emailAlreadyExists });
    }
  };

  render() {
    const { submitting, error, unknownEmailError, passwordRequired, email, password } = this.state;
    const displayedForm = this.props.form || this.state.form;
    const routes = this.props.routes || {};

    // No need to show the form if an email is provided
    const hasError = Boolean(unknownEmailError || error);
    if (this.props.email && !hasError) {
      return <Loading />;
    }

    return (
      <Flex flexDirection="column" width={1} alignItems="center">
        <Fragment>
          {displayedForm !== 'create-account' && !error ? (
            <SignIn
              email={email}
              password={password}
              onEmailChange={email => this.setState({ email, unknownEmailError: false, emailAlreadyExists: false })}
              onPasswordChange={password => this.setState({ password })}
              onSecondaryAction={
                routes.join ||
                (() =>
                  this.switchForm('create-account', {
                    isOAuth: this.props.isOAuth,
                    oAuthAppName: this.props.oAuthApplication?.name,
                    oAuthAppImage: this.props.oAuthApplication?.account?.imageUrl,
                  }))
              }
              onSubmit={options => this.signIn(email, password, options)}
              loading={submitting}
              unknownEmail={unknownEmailError}
              passwordRequired={passwordRequired}
              label={this.props.signInLabel}
              showSubHeading={this.props.showSubHeading}
              showOCLogo={this.props.showOCLogo}
              showSecondaryAction={!this.props.disableSignup}
              isOAuth={this.props.isOAuth}
              oAuthAppName={this.props.oAuthApplication?.name}
              oAuthAppImage={this.props.oAuthApplication?.account?.imageUrl}
            />
          ) : (
            <Flex flexDirection="column" width={1} alignItems="center">
              <Flex justifyContent="center" width={1}>
                <Box maxWidth={535} mx={[2, 4]} width="100%">
                  <CreateProfile
                    email={email}
                    name={this.state.name}
                    newsletterOptIn={this.state.newsletterOptIn}
                    tosOptIn={this.state.tosOptIn}
                    onEmailChange={email =>
                      this.setState({ email, unknownEmailError: false, emailAlreadyExists: false })
                    }
                    onFieldChange={(name, value) => this.setState({ [name]: value })}
                    onSubmit={this.createProfile}
                    onSecondaryAction={routes.signin || (() => this.switchForm('signin'))}
                    submitting={submitting}
                    emailAlreadyExists={this.state.emailAlreadyExists}
                    isOAuth={this.state.isOAuth}
                    oAuthAppName={this.state.oAuthAppName}
                    oAuthAppImage={this.state.oAuthAppImage}
                  />
                </Box>
              </Flex>
            </Flex>
          )}
          {!this.props.hideFooter && (
            <Container
              mt="128px"
              pl={['20px', '20px', '144px']}
              pr={['20px', '20px', '144px']}
              maxWidth="880px"
              width={1}
            >
              <StyledHr borderStyle="solid" borderColor="black.200" mb="16px" />
              <Flex justifyContent="space-between" flexDirection={['column', 'row']} alignItems="center">
                <Span>
                  <SignInFooterLink href="/privacypolicy">
                    <FormattedMessage defaultMessage="Read our privacy policy" />
                  </SignInFooterLink>
                </Span>
                <Span mt={['32px', 0]}>
                  <SignInFooterLink href="/contact">
                    <FormattedMessage id="error.contactSupport" defaultMessage="Contact support" />
                  </SignInFooterLink>
                </Span>
              </Flex>
            </Container>
          )}
        </Fragment>
      </Flex>
    );
  }
}

const signupMutation = gqlV1/* GraphQL */ `
  mutation Signup($user: UserInputType!, $organization: CollectiveInputType, $redirect: String, $websiteUrl: String) {
    createUser(user: $user, organization: $organization, redirect: $redirect, websiteUrl: $websiteUrl) {
      user {
        id
        email
        name
      }
      organization {
        id
        slug
      }
    }
  }
`;

export const addSignupMutation = graphql(signupMutation, { name: 'createUser' });

export default withToasts(injectIntl(addSignupMutation(withUser(withRouter(SignInOrJoinFree)))));

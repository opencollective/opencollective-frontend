import React, { Fragment } from 'react';
import type { ApolloClient } from '@apollo/client';
import { withApollo } from '@apollo/client/react/hoc';
import type { Router } from 'next/router';
import { withRouter } from 'next/router';
import type { IntlShape } from 'react-intl';
import { FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';
import { isEmail } from 'validator';

import { resendOTP, signin, signup, verifyEmail } from '../lib/api';
import { ERROR, formatErrorMessage, i18nGraphqlException } from '../lib/errors';
import { gql } from '../lib/graphql/helpers';
import { getWebsiteUrl, isTrustedSigninRedirectionUrl } from '../lib/utils';
import injectIntl from '@/lib/injectIntl';

import { toast } from './ui/useToast';
import Container from './Container';
import CreateProfile from './CreateProfile';
import { Box, Flex } from './Grid';
import Link from './Link';
import Loading from './Loading';
import SignIn from './SignIn';
import SignupCodeVerification from './SignupCodeVerification';
import StyledHr from './StyledHr';
import { Span } from './Text';
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

type SignInOrJoinFreeForm = 'signin' | 'create-account';

type OAuthDetails = {
  isOAuth?: boolean;
  oAuthAppName?: string;
  oAuthAppImage?: string;
};

type SignInOrJoinFreeProps = {
  /** Redirect URL */
  redirect?: string;
  /** To pre-fill the "email" field */
  defaultEmail?: string;
  /** Provide this to automatically sign in the given email */
  email?: string;
  /** @ignore from withApollo */
  client?: ApolloClient<unknown>;
  /** Called when a visitor has signed up through the form, right before they are signed in */
  onSignup?: () => void;
  /** Whether user can signup from there */
  disableSignup?: boolean;
  /** Use this prop to use this as a controlled component */
  form?: SignInOrJoinFreeForm;
  /** Set the initial view for the component */
  defaultForm?: SignInOrJoinFreeForm;
  /** If provided, component will use links instead of buttons to make the switch */
  routes?: {
    signin?: string;
    join?: string;
  };
  /** Label for signIn, defaults to "Continue with your email" */
  signInLabel?: React.ReactNode;
  /** @ignore from injectIntl */
  intl?: IntlShape;
  router: Router;
  hideFooter?: boolean;
  isOAuth?: boolean;
  showSubHeading?: boolean;
  showOCLogo?: boolean;
  oAuthApplication?: {
    name?: string;
    account?: {
      imageUrl?: string;
    };
  };
  /* From UserProvider / withUser */
  login?: (token: string) => Promise<unknown>;
  /** whether the input needs to be auto-focused */
  autoFocus?: boolean;
  /** whether to update the page title when the sign in form is active */
  noSignInTitle?: boolean;
  whitelabelProvider?: {
    name?: string;
    squareLogo?: {
      url?: string;
    };
  };
};

type SignInOrJoinFreeState = {
  form: SignInOrJoinFreeForm;
  error?: string;
  submitting: boolean;
  unknownEmailError: boolean;
  email: string;
  emailAlreadyExists: boolean;
  isOAuth?: boolean;
  oAuthAppName?: string;
  oAuthAppImage?: string;
  passwordRequired?: boolean;
  password?: string;
  name?: string;
  newsletterOptIn?: boolean;
  tosOptIn?: boolean;
  /** Set once `/users/signup` has sent a code: the form is replaced by the code step */
  signupSessionId?: string;
};

/**
 * Shows a SignIn form by default, with the ability to switch to SignUp form. It
 * also has the API methods binded, so you can use it directly.
 */
class SignInOrJoinFree extends React.Component<SignInOrJoinFreeProps, SignInOrJoinFreeState> {
  constructor(props: SignInOrJoinFreeProps) {
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

  switchForm = (form: SignInOrJoinFreeForm, oAuthDetails: OAuthDetails = {}) => {
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
      redirectUrl = '/dashboard';
    }
    return encodeURIComponent(redirectUrl || currentPath || '/');
  }

  signIn = async (
    email: string,
    password: string = null,
    { sendLink = false, resetPassword = false }: { sendLink?: boolean; resetPassword?: boolean } = {},
  ) => {
    if (this.state.submitting) {
      return false;
    }

    this.setState({ submitting: true, error: null });

    try {
      const redirect = this.getRedirectURL();
      const response = await signin({
        user: { email, password },
        redirect,
        websiteUrl: getWebsiteUrl(),
        sendLink,
        resetPassword,
      });

      // test*@opencollective.com.
      if (response.redirect) {
        // Use browser redirection to guarantee page, login, and router state are all updated.
        window.location.href = response.redirect;
      } else if (response.token) {
        const user = await this.props.login(response.token);
        if (!user) {
          this.setState({ error: 'Token rejected' });
        }
        const isTrustedWhitelabel = isTrustedSigninRedirectionUrl(decodeURIComponent(redirect));
        if (isTrustedWhitelabel) {
          const parsedUrl = new URL(decodeURIComponent(redirect));
          parsedUrl.searchParams.set('token', response.token);
          parsedUrl.searchParams.set('next', parsedUrl.pathname);
          parsedUrl.pathname = '/signin';
          window.location.href = parsedUrl.toString();
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
      } else if (e.json?.errorCode === 'EMAIL_AWAITING_VERIFICATION') {
        toast({
          variant: 'error',
          message: (
            <FormattedMessage
              defaultMessage="Email not verified, please finish signing up."
              id="signup.requiresVerificationError"
            />
          ),
        });
        setTimeout(() => {
          this.props.router.push({ pathname: '/signup', query: { email } });
        }, 1000);
      } else if (e.message?.includes('Two-factor authentication is enabled')) {
        this.setState({ submitting: false });
      } else {
        toast({
          variant: 'error',
          message: e.json?.message || e.message || 'Server error',
        });
        this.setState({ submitting: false });
      }
    }
  };

  createProfile = async (data: {
    email?: string;
    name?: string;
    newsletterOptIn?: boolean;
    captcha?: { token?: string; provider?: string };
  }) => {
    if (this.state.submitting) {
      return false;
    }

    this.setState({ submitting: true, error: null });

    // The name and newsletter choice are saved once the email is verified (see `verifySignupCode`)
    const response = await signup({ email: data.email, captcha: data.captcha });
    if (response.success) {
      this.setState({
        submitting: false,
        signupSessionId: response.sessionId,
        email: data.email,
        name: data.name,
        newsletterOptIn: data.newsletterOptIn,
      });
      window.scrollTo(0, 0);
    } else {
      const emailAlreadyExists = response.error?.type === ERROR.USER_ALREADY_EXISTS;
      if (!emailAlreadyExists) {
        this.showSignupError(response.error);
      }
      this.setState({ submitting: false, emailAlreadyExists });
    }
  };

  showSignupError(error: { type?: string; message?: string } | string) {
    const message =
      (typeof error === 'string' ? error : formatErrorMessage(this.props.intl, error, null) || error?.message) ||
      formatErrorMessage(this.props.intl);
    toast({ variant: 'error', message });
  }

  /** The challenge is over (expired, too many wrong codes): back to the form to request a new code */
  restartSignup() {
    toast({
      variant: 'error',
      message: (
        <FormattedMessage
          defaultMessage="This verification link is no longer valid. Please start again."
          id="signup.otp.sessionExpired"
        />
      ),
    });
    this.setState({ submitting: false, signupSessionId: null });
  }

  resendSignupCode = async () => {
    const { email, signupSessionId } = this.state;
    const response = await resendOTP({ email, sessionId: signupSessionId });
    if (this.state.signupSessionId !== signupSessionId) {
      return; // The visitor went back and started another sign-up meanwhile
    } else if (response.success) {
      toast({
        variant: 'success',
        message: (
          <FormattedMessage
            defaultMessage="A new OTP code has been sent to your email."
            id="signup.otp.resendSuccess"
          />
        ),
      });
    } else if (response.error?.type === 'NOT_FOUND') {
      this.restartSignup();
    } else {
      this.showSignupError(response.error);
    }
  };

  verifySignupCode = async (otp: string) => {
    if (this.state.submitting) {
      return false;
    }

    this.setState({ submitting: true });
    const { email, signupSessionId } = this.state;
    const response = await verifyEmail({ email, otp, sessionId: signupSessionId });
    if (!response.success) {
      if (response.error?.type === 'NOT_FOUND') {
        this.restartSignup();
      } else {
        this.showSignupError(response.error);
        this.setState({ submitting: false });
      }
      return;
    }

    // Signed in on the spot: the page showing this form carries on (or redirects, see `onSignup`)
    const { token } = response;
    await this.saveNewProfile(token);
    this.props.onSignup?.();
    const user = await this.props.login(token);
    if (!user) {
      // The account is created and verified: the visitor can sign in with their email
      this.showSignupError(null);
      this.setState({ submitting: false, signupSessionId: null });
    }
  };

  /**
   * Saves what the form asked for besides the email. Runs before `login`, with the new token and without
   * touching the Apollo cache: the page only learns about the user at `login`, and loads a complete profile.
   * (Writing `me` to the cache here makes pages that watch it refetch before the name is saved.)
   */
  async saveNewProfile(token: string) {
    const { client } = this.props;
    const { name, newsletterOptIn } = this.state;
    const options = { context: { headers: { authorization: `Bearer ${token}` } }, fetchPolicy: 'no-cache' as const };
    try {
      const { data } = await client.query({ query: signupProfileQuery, ...options });
      await client.mutate({
        mutation: completeSignupProfileMutation,
        variables: { account: { id: data.me.id, name } },
        ...options,
      });
      if (newsletterOptIn) {
        await client.mutate({ mutation: signupNewsletterOptInMutation, variables: { newsletterOptIn }, ...options });
      }
    } catch (error) {
      // The account exists and is verified: sign in anyway, the profile can be completed later
      toast({ variant: 'error', message: i18nGraphqlException(this.props.intl, error) });
    }
  }

  render() {
    const { submitting, error, unknownEmailError, passwordRequired, email, password } = this.state;
    const displayedForm = this.props.form || this.state.form;
    const routes = this.props.routes || {};
    const whitelabelProvider = this.props.whitelabelProvider;

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
              autoFocus={this.props.autoFocus}
              noSignInTitle={this.props.noSignInTitle}
              whitelabelProvider={whitelabelProvider}
            />
          ) : this.state.signupSessionId ? (
            <Box maxWidth={535} mx={[2, 4]} width="100%">
              <SignupCodeVerification
                email={email}
                loading={submitting}
                onSubmit={this.verifySignupCode}
                onResend={this.resendSignupCode}
                onBack={() => this.setState({ signupSessionId: null })}
              />
            </Box>
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
                    // Computed key: `CreateProfile` reports the field name to update
                    onFieldChange={(name, value) => this.setState({ [name]: value } as SignInOrJoinFreeState)}
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
              <Flex justifyContent="space-between" gap="8px" flexDirection={['column', 'row']} alignItems="center">
                <Span>
                  <SignInFooterLink href="/privacypolicy">
                    <FormattedMessage defaultMessage="Read our privacy policy" id="8aLrwg" />
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

const signupProfileQuery = gql`
  query SignInOrJoinFreeSignupProfile {
    me {
      id
    }
  }
`;

const completeSignupProfileMutation = gql`
  mutation SignInOrJoinFreeCompleteProfile($account: AccountUpdateInput!) {
    editAccount(account: $account) {
      id
    }
  }
`;

const signupNewsletterOptInMutation = gql`
  mutation SignInOrJoinFreeNewsletterOptIn($newsletterOptIn: Boolean!) {
    setNewsletterOptIn(newsletterOptIn: $newsletterOptIn) {
      id
    }
  }
`;

export default withUser(injectIntl(withApollo<Omit<SignInOrJoinFreeProps, 'router'>>(withRouter(SignInOrJoinFree))));

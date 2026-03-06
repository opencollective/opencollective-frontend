import React, { Fragment } from 'react';
import { graphql } from '@apollo/client/react/hoc';
import { get, pick } from 'lodash';
import type { NextRouter } from 'next/router';
import { withRouter } from 'next/router';
import type { WrappedComponentProps } from 'react-intl';
import { FormattedMessage, injectIntl } from 'react-intl';
import { styled } from 'styled-components';
import { isEmail } from 'validator';

import { signin } from '../lib/api';
import type { WhitelabelProvider } from '../lib/constants/whitelabel-providers';
import { i18nGraphqlException } from '../lib/errors';
import { API_V1_CONTEXT, gqlV1 } from '../lib/graphql/helpers';
import { getWebsiteUrl, isTrustedSigninRedirectionUrl } from '../lib/utils';

import { toast } from './ui/useToast';
import Container from './Container';
import CreateProfile from './CreateProfile';
import { Box, Flex } from './Grid';
import Link from './Link';
import Loading from './Loading';
import SignIn from './SignIn';
import StyledHr from './StyledHr';
import { Span } from './Text';
import type { UserContextValue } from './UserProvider';
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

type SignInOrJoinFreeProps = {
  redirect?: string;
  defaultEmail?: string;
  email?: string | null;
  form?: SignInOrJoinFreeForm;
  defaultForm?: SignInOrJoinFreeForm;
  routes?: { signin: string; join: string };
  signInLabel?: React.ReactNode;
  hideFooter?: boolean;
  isOAuth?: boolean;
  showSubHeading?: boolean;
  showOCLogo?: boolean;
  autoFocus?: boolean;
  noSignInTitle?: boolean;
  whitelabelProvider?: WhitelabelProvider;
  disableSignup?: boolean;
  oAuthApplication?: {
    name?: string;
    account?: { imageUrl?: string };
  };
};

/** Props injected by graphql(signupMutation, { name: 'createUser' }) */
type SignupMutationProps = {
  createUser: (args: {
    variables: {
      user: Record<string, unknown>;
      organization?: Record<string, unknown> | null;
      redirect?: string;
      websiteUrl?: string;
      captcha?: unknown;
    };
  }) => Promise<unknown>;
};

/** Full internal props: own props + all HOC-injected props */
type InternalProps = SignInOrJoinFreeProps &
  Pick<UserContextValue, 'login'> &
  WrappedComponentProps & { router: NextRouter } & SignupMutationProps;

type SignInOrJoinFreeState = {
  form: SignInOrJoinFreeForm;
  error: string | null;
  submitting: boolean;
  unknownEmailError: boolean;
  email: string;
  emailAlreadyExists: boolean;
  isOAuth?: boolean;
  oAuthAppName?: string;
  oAuthAppImage?: string;
  password?: string;
  passwordRequired?: boolean;
  name?: string;
  newsletterOptIn?: boolean;
  tosOptIn?: boolean;
};

type SigninError = Error & { json?: { errorCode?: string; message?: string }; message?: string };

/**
 * Shows a SignIn form by default, with the ability to switch to SignUp form. It
 * also has the API methods binded, so you can use it directly.
 */
class SignInOrJoinFree extends React.Component<InternalProps, SignInOrJoinFreeState> {
  constructor(props: InternalProps) {
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

  override componentDidMount() {
    if (this.props.email && isEmail(this.props.email)) {
      this.signIn(this.props.email);
    }
  }

  switchForm = (
    form: SignInOrJoinFreeForm,
    oAuthDetails: { isOAuth?: boolean; oAuthAppName?: string; oAuthAppImage?: string } = {},
  ) => {
    this.setState({
      form,
      isOAuth: oAuthDetails.isOAuth,
      oAuthAppName: oAuthDetails.oAuthAppName,
      oAuthAppImage: oAuthDetails.oAuthAppImage,
    });
  };

  getRedirectURL(): string {
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
    password: string | null = null,
    options: { sendLink?: boolean; resetPassword?: boolean } = {},
  ) => {
    if (this.state.submitting) {
      return false;
    }

    this.setState({ submitting: true, error: null });
    const { sendLink = false, resetPassword = false } = options;

    try {
      const redirect = this.getRedirectURL();
      const response = await signin({
        user: { email, password },
        redirect,
        websiteUrl: getWebsiteUrl(),
        sendLink,
        resetPassword,
        createProfile: false,
      });

      if (response.redirect) {
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
      const err = e as SigninError;
      if (err.json?.errorCode === 'EMAIL_DOES_NOT_EXIST') {
        this.setState({ unknownEmailError: true, submitting: false });
      } else if (err.json?.errorCode === 'PASSWORD_REQUIRED') {
        this.setState({ passwordRequired: true, submitting: false });
      } else if (err.json?.errorCode === 'EMAIL_AWAITING_VERIFICATION') {
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
      } else if (err.message?.includes('Two-factor authentication is enabled')) {
        this.setState({ submitting: false });
      } else {
        toast({
          variant: 'error',
          message: err.json?.message || err.message || 'Server error',
        });
        this.setState({ submitting: false });
      }
    }
  };

  createProfile = async (data: Record<string, unknown>) => {
    if (this.state.submitting) {
      return false;
    }
    const user = pick(data, ['email', 'name', 'legalName', 'newsletterOptIn']);
    const organizationData = pick(data, ['orgName', 'orgLegalName', 'githubHandle', 'twitterHandle', 'website']);
    const organization =
      Object.keys(organizationData).length > 0 ? (organizationData as Record<string, unknown>) : null;
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
          user: user as Record<string, unknown>,
          organization,
          redirect: this.getRedirectURL(),
          websiteUrl: getWebsiteUrl(),
          captcha: data.captcha,
        },
      });
      await this.props.router.push({
        pathname: '/signin/sent',
        query: { email: String(user.email) },
      });
      window.scrollTo(0, 0);
    } catch (error) {
      const emailAlreadyExists =
        get(error as Record<string, unknown>, 'graphQLErrors.0.extensions.code') === 'EMAIL_ALREADY_EXISTS';
      if (!emailAlreadyExists) {
        toast({
          variant: 'error',
          message: i18nGraphqlException(this.props.intl, error as Error),
        });
      }
      this.setState({ submitting: false, emailAlreadyExists });
    }
  };

  override render() {
    const { submitting, error, unknownEmailError, passwordRequired, email, password } = this.state;
    const displayedForm = this.props.form || this.state.form;
    const routes: { signin?: string; join?: string } = this.props.routes || {};
    const whitelabelProvider = this.props.whitelabelProvider;

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
              onSubmit={options => this.signIn(email, password ?? null, options)}
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
                    onFieldChange={(name, value) =>
                      this.setState(prev => ({ ...prev, [name]: value }) as SignInOrJoinFreeState)
                    }
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

const signupMutation = gqlV1 /* GraphQL */ `
  mutation Signup(
    $user: UserInputType!
    $organization: CollectiveInputType
    $redirect: String
    $websiteUrl: String
    $captcha: CaptchaInputType
  ) {
    createUser(
      user: $user
      organization: $organization
      redirect: $redirect
      websiteUrl: $websiteUrl
      captcha: $captcha
    ) {
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

const addSignupMutation = graphql(signupMutation, {
  name: 'createUser',
  options: { context: API_V1_CONTEXT },
});

// HOC chain: assertions needed because withRouter/graphql/injectIntl/withUser typings don't preserve our props
const SignInOrJoinFreeWrapped = withUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  injectIntl(addSignupMutation(withRouter(SignInOrJoinFree as any)) as any) as any,
) as React.ComponentType<SignInOrJoinFreeProps>;

export default SignInOrJoinFreeWrapped;

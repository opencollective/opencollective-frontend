import React from 'react';
import { mapValues } from 'lodash';
import type { NextPageContext } from 'next';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import { isEmail } from 'validator';

import { isSuspiciousUserAgent, RobotsDetector } from '../lib/robots-detector';
import { isTrustedSigninRedirectionUrl, isValidRelativeUrl } from '../lib/utils';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '@/lib/local-storage';
import type { WhitelabelProps } from '@/lib/whitelabel';
import { getWhitelabelProps } from '@/lib/whitelabel';

import Body from '../components/Body';
import { Flex } from '../components/Grid';
import Header from '../components/Header';
import Loading from '../components/Loading';
import LoadingGrid from '../components/LoadingGrid';
import MessageBox from '../components/MessageBox';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { P } from '../components/Text';
import { withUser } from '../components/UserProvider';

type SigninPageProps = {
  token: string;
  next: string;
  form: 'signin' | 'create-account';
  isSuspiciousUserAgent: boolean;
  email: string;
  login: (token?: string) => Promise<any>;
  errorLoggedInUser: string;
  LoggedInUser: any;
  loadingLoggedInUser: boolean;
  router: any;
  whitelabel: WhitelabelProps;
  untrustedDomainRedirection: boolean;
};

type SigninPageState = {
  error: string | null;
  success: boolean | null;
  isRobot: boolean;
  redirecting: boolean;
};

class SigninPage extends React.Component<SigninPageProps, SigninPageState> {
  static async getInitialProps(context: NextPageContext) {
    const {
      query: { token, form },
      req,
    } = context;
    let { email, next } = context.query;
    // Decode next URL if URI encoded
    if (typeof next === 'string' && next.includes('%2F')) {
      next = decodeURIComponent(next);
    }

    const whitelabelProps = await getWhitelabelProps(context as any);
    const isTrustedRedirection = isTrustedSigninRedirectionUrl(next as string, whitelabelProps.providers);
    const isValidRelative = isValidRelativeUrl(next);
    email = typeof email === 'string' && decodeURIComponent(email);
    return {
      token,
      next: next && (isValidRelative || isTrustedRedirection) ? next : null,
      form: form || 'signin',
      isSuspiciousUserAgent: isSuspiciousUserAgent((req as any)?.get('User-Agent')),
      email: email && isEmail(email) ? email : null,
      untrustedDomainRedirection: !isValidRelative && !isTrustedRedirection ? next : null,
    };
  }

  constructor(props) {
    super(props);
    this.robotsDetector = new RobotsDetector();
    this.state = { error: null, success: null, isRobot: props.isSuspiciousUserAgent, redirecting: false };
  }

  componentDidMount() {
    if (this.state.isRobot) {
      this.robotsDetector.startListening(() => this.setState({ isRobot: false }));
    } else if (
      !this.props.token &&
      this.props.whitelabel?.isNonPlatformDomain &&
      this.props.whitelabel?.isWhitelabelDomain
    ) {
      const platformSignInUrl = new URL(`${process.env.WEBSITE_URL}/signin`);
      platformSignInUrl.searchParams.set('next', window.location.origin + (this.props.next || '/'));
      this.props.router.replace(platformSignInUrl.toString());
    } else {
      this.initialize();
    }
  }

  async componentDidUpdate(oldProps, oldState) {
    if (oldState.isRobot && !this.state.isRobot) {
      this.initialize();
    } else if (!this.state.redirecting && this.props.token && oldProps.token !== this.props.token) {
      // --- There's a new token in town 🤠 ---
      const user = await this.props.login(this.props.token);
      if (!user) {
        this.setState({ error: 'Token rejected' });
      }
    } else if (
      !this.state.redirecting &&
      this.props.LoggedInUser &&
      !this.props.errorLoggedInUser &&
      this.props.form !== 'create-account'
    ) {
      // --- User logged in ---
      this.setState({ success: true, redirecting: true });
      // Avoid redirect loop: replace '/signin' redirects by '/'
      const { next } = this.props;
      let redirect = next && (next.match(/^\/?signin[?/]?/) || next.match(/^\/?reset-password[?/]?/)) ? null : next;
      const isTrustedWhitelabel = isTrustedSigninRedirectionUrl(redirect, this.props.whitelabel?.providers);
      if (isTrustedWhitelabel) {
        const parsedUrl = new URL(redirect);
        const token = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
        parsedUrl.searchParams.set('token', token);
        parsedUrl.searchParams.set('next', parsedUrl.pathname);
        parsedUrl.pathname = '/signin';
        redirect = parsedUrl.toString();
      }
      const defaultRedirect = '/dashboard';
      await this.props.router.replace(redirect && redirect !== '/' ? redirect : defaultRedirect);
      window.scroll(0, 0);
    }
  }

  componentWillUnmount() {
    this.robotsDetector.stopListening();
  }

  robotsDetector: RobotsDetector;

  async initialize() {
    if (this.props.token) {
      let user;
      try {
        user = await this.props.login(this.props.token);

        // If given token is invalid, try to login with the old one
        if (!user) {
          user = await this.props.login();
        }

        // If there's no user at this point, there's no chance we can login
        if (!user) {
          this.setState({ error: 'Token rejected' });
        }
      } catch (err) {
        this.setState({ error: err.message || err });
      }
    } else {
      this.props.login();
    }
  }

  getRoutes() {
    const { next } = this.props;
    const routes = { signin: '/signin', join: '/create-account' };
    if (!next) {
      return routes;
    } else {
      const urlParams = `?next=${encodeURIComponent(next)}`;
      return mapValues(routes, route => `${route}${urlParams}`);
    }
  }

  renderContent() {
    const { loadingLoggedInUser, errorLoggedInUser, token, next, form, LoggedInUser, whitelabel } = this.props;

    if (whitelabel?.isNonPlatformDomain && !whitelabel?.isWhitelabelDomain) {
      return (
        <MessageBox type="error" withIcon>
          <FormattedMessage id="domain.notAuthorized" defaultMessage="This page is not available on this domain." />
        </MessageBox>
      );
    } else if (this.props.untrustedDomainRedirection) {
      return (
        <MessageBox type="error" withIcon>
          <FormattedMessage
            id="signin.untrustedDomain"
            defaultMessage="You've been requested to log-in to Open Collective by an untrusted domain: {domain}"
            values={{ domain: this.props.untrustedDomainRedirection }}
          />
        </MessageBox>
      );
    } else if (this.state.isRobot && token) {
      return (
        <Flex flexDirection="column" alignItems="center" px={3} pb={3}>
          <P fontSize="30px" mb={3}>
            <span role="img" aria-label="Robot Emoji">
              🤖
            </span>
          </P>
          <P mb={5} textAlign="center">
            <FormattedMessage
              id="checkingBrowser"
              defaultMessage="Your browser is being verified. If this message doesn't disappear, try to move your mouse or to touch your screen for mobile."
            />
          </P>
          <Loading />
        </Flex>
      );
    } else if ((loadingLoggedInUser || this.state.success) && token) {
      return <Loading />;
    } else if (!loadingLoggedInUser && LoggedInUser && form === 'create-account') {
      return (
        <MessageBox type="warning" withIcon>
          <FormattedMessage
            id="createAccount.alreadyLoggedIn"
            defaultMessage={`It seems like you're already signed in as "{email}". If you want to create a new account, please log out first.`}
            values={{ email: LoggedInUser.email }}
          />
        </MessageBox>
      );
    }

    const error = errorLoggedInUser || this.state.error;

    if (loadingLoggedInUser || this.state.redirecting || (token && !error)) {
      return <LoadingGrid />;
    }

    return (
      <React.Fragment>
        {error && !error.includes('Two-factor authentication is enabled') && (
          <MessageBox type="error" withIcon mb={4} data-cy="signin-message-box">
            <strong>
              <FormattedMessage
                id="login.failed"
                defaultMessage="Sign In failed: {message}."
                values={{ message: error }}
              />
            </strong>
            <br />
            {!error?.includes('Two-factor authentication') && (
              <FormattedMessage
                id="login.askAnother"
                defaultMessage="You can ask for a new sign in link using the form below."
              />
            )}
          </MessageBox>
        )}
        <SignInOrJoinFree email={this.props.email} redirect={next || '/'} form={form} routes={this.getRoutes()} />
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className="LoginPage">
        <Header
          title={this.props.form === 'signin' ? 'Sign In' : 'Create Account'}
          description="Create your profile on Open Collective and show the world the open collectives that you are contributing to."
          menuItems={{ solutions: false, product: false, company: false, docs: false }}
          showSearch={false}
          showProfileAndChangelogMenu={false}
        />
        <Body>
          <Flex flexDirection="column" alignItems="center" my={[4, 6]} p={2}>
            {this.renderContent()}
          </Flex>
        </Body>
      </div>
    );
  }
}

// next.js export
// ts-unused-exports:disable-next-line
export default withUser(withRouter(SigninPage));

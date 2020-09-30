import React from 'react';
import PropTypes from 'prop-types';
import { mapValues } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../lib/local-storage';
import { isValidRelativeUrl } from '../lib/utils';
import { Router } from '../server/pages';

import Body from '../components/Body';
import Footer from '../components/Footer';
import { Flex } from '../components/Grid';
import Header from '../components/Header';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { withUser } from '../components/UserProvider';

class SigninPage extends React.Component {
  static getInitialProps({ query: { token, next, form } }) {
    // Decode next URL if URI encoded
    if (next && next.startsWith('%2F')) {
      next = decodeURIComponent(next);
    }

    next = next && isValidRelativeUrl(next) ? next : null;
    return { token, next, form: form || 'signin' };
  }

  static propTypes = {
    form: PropTypes.oneOf(['signin', 'create-account']).isRequired,
    token: PropTypes.string,
    next: PropTypes.string,
    login: PropTypes.func,
    errorLoggedInUser: PropTypes.string,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    enforceTwoFactorAuthForLoggedInUser: PropTypes.bool,
  };

  state = { error: null, success: null };

  async componentDidMount() {
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

  async componentDidUpdate(oldProps) {
    const wasConnected = !oldProps.LoggedInUser && this.props.LoggedInUser;
    if (wasConnected && !this.props.errorLoggedInUser && this.props.form !== 'create-account') {
      // --- User logged in ---
      this.setState({ success: true });
      // Avoid redirect loop: replace '/signin' redirects by '/'
      const { next } = this.props;
      const redirect = next && next.match(/^\/?signin[?/]?/) ? null : next;
      await Router.replaceRoute(redirect || '/');
      window.scroll(0, 0);
    } else if (this.props.token && oldProps.token !== this.props.token) {
      // --- There's a new token in town 🤠 ---
      const user = await this.props.login(this.props.token);
      if (!user) {
        this.setState({ error: 'Token rejected' });
      }
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
    const {
      loadingLoggedInUser,
      errorLoggedInUser,
      token,
      next,
      form,
      LoggedInUser,
      enforceTwoFactorAuthForLoggedInUser,
    } = this.props;

    if ((loadingLoggedInUser || this.state.success) && token) {
      return <Loading />;
    } else if (!loadingLoggedInUser && LoggedInUser && form === 'create-account') {
      return (
        <MessageBox type="warning" withIcon>
          <FormattedMessage
            id="createAccount.alreadyLoggedIn"
            defaultMessage='It seems like you&apos;re already signed in as "{email}". If you want to create a new account, please log out first.'
            values={{ email: LoggedInUser.email }}
          />
        </MessageBox>
      );
    }

    const error = errorLoggedInUser || this.state.error;

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
        <SignInOrJoinFree
          redirect={next || '/'}
          form={form}
          routes={this.getRoutes()}
          enforceTwoFactorAuthForLoggedInUser={enforceTwoFactorAuthForLoggedInUser}
          submitTwoFactorAuthenticatorCode={values => {
            const localStorage2FAToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
            return this.props.login(localStorage2FAToken, values.twoFactorAuthenticatorCode);
          }}
        />
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className="LoginPage">
        <Header
          title="Login"
          description="Create your profile on Open Collective and show the world the open collectives that you are contributing to."
        />
        <Body>
          <Flex flexDirection="column" alignItems="center" my={[4, 6]} p={2}>
            {this.renderContent()}
          </Flex>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withUser(SigninPage);

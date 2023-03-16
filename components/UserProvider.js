import React from 'react';
import PropTypes from 'prop-types';
import { withApollo } from '@apollo/client/react/hoc';
import jwt from 'jsonwebtoken';
import { isEqual } from 'lodash';
import Router, { withRouter } from 'next/router';
import { injectIntl } from 'react-intl';

import withLoggedInUser from '../lib/hooks/withLoggedInUser';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS, removeFromLocalStorage } from '../lib/local-storage';
import UserClass from '../lib/LoggedInUser';
import { withTwoFactorAuthenticationPrompt } from '../lib/two-factor-authentication/TwoFactorAuthenticationContext';

import { TOAST_TYPE, withToasts } from './ToastProvider';

export const UserContext = React.createContext({
  loadingLoggedInUser: true,
  errorLoggedInUser: null,
  LoggedInUser: null,
  logout() {},
  login() {},
  refetchLoggedInUser() {},
});

class UserProvider extends React.Component {
  static propTypes = {
    getLoggedInUser: PropTypes.func.isRequired,
    addToast: PropTypes.func,
    twoFactorAuthPrompt: PropTypes.object,
    router: PropTypes.object,
    token: PropTypes.string,
    client: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    children: PropTypes.node,
    /**
     * If not used inside of NextJS (ie. in styleguide), the code that checks if we are
     * on `/signin` that uses `Router` will crash. Setting this prop bypass this behavior.
     */
    skipRouteCheck: PropTypes.bool,
  };

  state = {
    loadingLoggedInUser: true,
    LoggedInUser: null,
    errorLoggedInUser: null,
  };

  async componentDidMount() {
    window.addEventListener('storage', this.checkLogin);

    // Disable auto-login on SignIn page
    if (this.props.skipRouteCheck || Router.pathname !== '/signin') {
      await this.login();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('storage', this.checkLogin);
  }

  checkLogin = event => {
    if (event.key === 'LoggedInUser') {
      if (event.oldValue && !event.newValue) {
        return this.setState({ LoggedInUser: null });
      }
      if (!event.oldValue && event.newValue) {
        const { value } = JSON.parse(event.newValue);
        return this.setState({ LoggedInUser: new UserClass(value) });
      }

      const { value: oldValue } = JSON.parse(event.oldValue);
      const { value } = JSON.parse(event.newValue);

      if (!isEqual(oldValue, value)) {
        this.setState({ LoggedInUser: new UserClass(value) });
      }
    }
  };

  logout = async () => {
    removeFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    this.setState({ LoggedInUser: null, errorLoggedInUser: null });
    await this.props.client.resetStore();
  };

  login = async token => {
    const { getLoggedInUser, twoFactorAuthPrompt } = this.props;
    try {
      const LoggedInUser = token ? await getLoggedInUser({ token }) : await getLoggedInUser();
      this.setState({
        loadingLoggedInUser: false,
        errorLoggedInUser: null,
        LoggedInUser,
      });
      return LoggedInUser;
    } catch (error) {
      // If token from localStorage is invalid or expired, delete it
      if (!token && ['Invalid token', 'Expired token'].includes(error.message)) {
        this.logout();
      }

      // Store the error
      this.setState({ loadingLoggedInUser: false, errorLoggedInUser: error.message });
      if (error.message.includes('Two-factor authentication is enabled')) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            const token = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
            const decodedToken = jwt.decode(token);

            const result = await twoFactorAuthPrompt.open({
              supportedMethods: decodedToken.supported2FAMethods ?? ['totp', 'recovery_code'],
            });
            const LoggedInUser = await getLoggedInUser({
              token: getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN),
              twoFactorAuthenticatorCode: result.code,
              twoFactorAuthenticationType: result.type,
            });
            if (result.type === 'recovery_code') {
              this.props.router.replace({
                pathname: '/[slug]/admin/user-security',
                query: { slug: LoggedInUser.collective.slug },
              });
            } else {
              this.setState({
                loadingLoggedInUser: false,
                errorLoggedInUser: null,
                LoggedInUser,
              });
            }

            return LoggedInUser;
          } catch (e) {
            this.setState({ loadingLoggedInUser: false, errorLoggedInUser: e.message });
            this.props.addToast({
              type: TOAST_TYPE.ERROR,
              message: e.message,
            });

            // stop trying to get the code.
            if (
              e.type === 'too_many_requests' ||
              (e.type === 'unauthorized' && e.message.includes('Cannot use this token'))
            ) {
              throw new Error(e.message);
            }
          }
        }
      }
    }
  };

  /**
   * Same as `login` but skip loading the user from localStorage cache. Note
   * that Apollo keeps a local cache too, so you should first use
   * [refetchQueries](https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-mutation-options-refetchQueries)
   * if you really need to be up-to-date with server.
   */
  refetchLoggedInUser = async () => {
    const { getLoggedInUser } = this.props;
    try {
      const LoggedInUser = await getLoggedInUser();
      this.setState({
        errorLoggedInUser: null,
        loadingLoggedInUser: false,
        LoggedInUser,
      });
    } catch (error) {
      this.setState({ loadingLoggedInUser: false, errorLoggedInUser: error });
    }
    return true;
  };

  render() {
    return (
      <UserContext.Provider
        value={{ ...this.state, logout: this.logout, login: this.login, refetchLoggedInUser: this.refetchLoggedInUser }}
      >
        {this.props.children}
      </UserContext.Provider>
    );
  }
}

const { Consumer: UserConsumer } = UserContext;

const withUser = WrappedComponent => {
  const WithUser = props => <UserConsumer>{context => <WrappedComponent {...context} {...props} />}</UserConsumer>;

  WithUser.getInitialProps = async context => {
    return WrappedComponent.getInitialProps ? await WrappedComponent.getInitialProps(context) : {};
  };

  return WithUser;
};

export default withToasts(
  injectIntl(withApollo(withLoggedInUser(withTwoFactorAuthenticationPrompt(withRouter(UserProvider))))),
);

export { UserConsumer, withUser };

import React from 'react';
import PropTypes from 'prop-types';
import { withApollo } from '@apollo/client/react/hoc';
import { decodeJwt } from 'jose';
import { get, isEqual } from 'lodash';
import Router, { withRouter } from 'next/router';
import { injectIntl } from 'react-intl';

import { createError, ERROR, formatErrorMessage } from '../lib/errors';
import withLoggedInUser from '../lib/hooks/withLoggedInUser';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS, removeFromLocalStorage } from '../lib/local-storage';
import UserClass from '../lib/LoggedInUser';
import { withTwoFactorAuthenticationPrompt } from '../lib/two-factor-authentication/TwoFactorAuthenticationContext';

import { toast } from './ui/useToast';

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
    toast: PropTypes.func,
    twoFactorAuthPrompt: PropTypes.object,
    router: PropTypes.object,
    token: PropTypes.string,
    client: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    children: PropTypes.node,
    intl: PropTypes.object,
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

  logout = async ({ redirect, skipQueryRefetch } = {}) => {
    removeFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    removeFromLocalStorage(LOCAL_STORAGE_KEYS.LAST_DASHBOARD_SLUG);
    removeFromLocalStorage(LOCAL_STORAGE_KEYS.DASHBOARD_NAVIGATION_STATE);
    this.setState({ LoggedInUser: null, errorLoggedInUser: null });
    // Clear the Apollo store without automatically refetching queries
    await this.props.client.clearStore();

    // By default, we refetch all queries to make sure we don't display stale data
    if (!skipQueryRefetch) {
      await this.props.client.reFetchObservableQueries();
    }
    // Otherwise we refetch only the LoggedInUser query to make the API clear the rootRedirect cookie
    else {
      await this.props.client.refetchQueries({
        include: ['LoggedInUser'],
      });
    }

    if (redirect) {
      this.props.router.push({
        pathname: redirect,
      });
    }
  };

  login = async token => {
    const { getLoggedInUser, twoFactorAuthPrompt, intl } = this.props;

    try {
      const LoggedInUser = token ? await getLoggedInUser({ token }) : await getLoggedInUser();
      this.setState({
        loadingLoggedInUser: false,
        errorLoggedInUser: null,
        LoggedInUser,
      });
      return LoggedInUser;
    } catch (error) {
      // Malformed tokens are detected and removed by the frontend in `lib/hooks/withLoggedInUser.js` (search for "malformed")
      // Invalid tokens are ignored in the API, the user is treated as unauthenticated (see `parseJwt` in `server/middleware/authentication.js`)
      // There can therefore only be two types of errors here:
      // - Network/server errors: we'll display a message
      // - Expired tokens: we'll logout the user with a "Your session has expired. Please sign-in again." message
      const errorType = get(error, 'networkError.result.error.type');

      // For expired tokens, we directly logout & show a toast as we want to make sure it gets
      // displayed not matter what page the user is on.
      if (!token && errorType === 'jwt_expired') {
        this.logout();
        this.setState({ loadingLoggedInUser: false });
        const message = formatErrorMessage(intl, createError(ERROR.JWT_EXPIRED));
        toast({ variant: 'error', message });
        return null;
      }

      if (error.message.includes('Two-factor authentication is enabled')) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            const token = getFromLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN);
            const decodedToken = decodeJwt(token);

            const result = await twoFactorAuthPrompt.open({
              supportedMethods: decodedToken.supported2FAMethods,
              authenticationOptions: decodedToken.authenticationOptions,
              isRequired: true,
              allowRecovery: true,
            });

            const LoggedInUser = await getLoggedInUser({
              token: getFromLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN),
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
            removeFromLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN);

            return LoggedInUser;
          } catch (e) {
            this.setState({ loadingLoggedInUser: false, errorLoggedInUser: e.message });
            toast({
              variant: 'error',
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
      } else {
        // Store the error
        this.setState({ loadingLoggedInUser: false, errorLoggedInUser: error.message });
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

export default injectIntl(
  withApollo(withLoggedInUser(withTwoFactorAuthenticationPrompt(withRouter(injectIntl(UserProvider))))),
);

export { UserConsumer, withUser };

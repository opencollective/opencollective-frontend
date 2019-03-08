import React from 'react';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';

import { withApollo } from 'react-apollo';
import withLoggedInUser from '../lib/withLoggedInUser';
import UserClass from '../classes/LoggedInUser';
import { Router } from '../server/pages';

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
    token: PropTypes.string,
    client: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
  };

  state = {
    loadingLoggedInUser: true,
    LoggedInUser: null,
    errorLoggedInUser: null,
  };

  async componentDidMount() {
    window.addEventListener('storage', this.checkLogin);

    // Disable auto-login on SignIn page
    if (Router.pathname !== '/signin') {
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
    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('LoggedInUser');
    this.props.client.resetStore();
    this.setState({ LoggedInUser: null, errorLoggedInUser: null });
  };

  login = async token => {
    const { getLoggedInUser } = this.props;
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
      const LoggedInUser = await getLoggedInUser({ ignoreLocalStorage: true });
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

export default withApollo(withLoggedInUser(UserProvider));
export { UserConsumer, withUser };

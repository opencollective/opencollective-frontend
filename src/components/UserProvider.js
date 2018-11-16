import React from 'react';
import { isEqual } from 'lodash';

import { withApollo } from 'react-apollo';
import withLoggedInUser from '../lib/withLoggedInUser';
import UserClass from '../classes/LoggedInUser';

export const UserContext = React.createContext({
  loadingLoggedInUser: true,
  LoggedInUser: null,
  logout() {},
  login() {},
});

class UserProvider extends React.Component {
  state = {
    loadingLoggedInUser: true,
    LoggedInUser: null,
  };

  async componentDidMount() {
    window.addEventListener('storage', this.checkLogin);
    await this.login();
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
    this.setState({ LoggedInUser: null });
  };

  login = async () => {
    const { getLoggedInUser } = this.props;
    try {
      const LoggedInUser = await getLoggedInUser();
      this.setState({
        loadingLoggedInUser: false,
        LoggedInUser,
      });
    } catch (error) {
      this.setState({ loadingLoggedInUser: false });
    }
    return true;
  };

  render() {
    return (
      <UserContext.Provider
        value={{ ...this.state, logout: this.logout, login: this.login }}
      >
        {this.props.children}
      </UserContext.Provider>
    );
  }
}

const { Consumer: UserConsumer } = UserContext;

const withUser = WrappedComponent => {
  const WithUser = props => (
    <UserConsumer>
      {context => <WrappedComponent {...context} {...props} />}
    </UserConsumer>
  );

  WithUser.getInitialProps = async context => {
    return WrappedComponent.getInitialProps
      ? await WrappedComponent.getInitialProps(context)
      : {};
  };

  return WithUser;
};

export default withApollo(withLoggedInUser(UserProvider));
export { UserConsumer, withUser };

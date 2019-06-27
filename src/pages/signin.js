import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';

import { Router } from '../server/pages';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';

import { isValidRelativeUrl } from '../lib/utils';

import { withUser } from '../components/UserProvider';
import Loading from '../components/Loading';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import MessageBox from '../components/MessageBox';

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
  };

  static routes = { signin: '/signin', join: '/create-account' };

  state = { error: null, success: null };

  async componentDidMount() {
    if (this.props.token) {
      let user = await this.props.login(this.props.token);

      // If given token is invalid, try to login with the old one
      if (!user) {
        user = await this.props.login();
      }

      // If there's no user at this point, there's no chance we can login
      if (!user) {
        this.setState({ error: 'Token rejected' });
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
      // --- There's a new token in town ---
      const user = await this.props.login(this.props.token);
      if (!user) {
        this.setState({ error: 'Token rejected' });
      }
    }
  }

  renderContent() {
    const { loadingLoggedInUser, errorLoggedInUser, token, next, form, LoggedInUser } = this.props;

    if ((loadingLoggedInUser || this.state.success) && token) {
      return <Loading />;
    } else if (!loadingLoggedInUser && LoggedInUser && form === 'create-account') {
      return (
        <MessageBox type="warning" withIcon>
          <FormattedMessage
            id="createAccount.alreadyLoggedIn"
            defaultMessage="It seems like you're already signed in as '{email}'. If you want to create a new account, please log out first."
            values={{ email: LoggedInUser.email }}
          />
        </MessageBox>
      );
    }

    const error = errorLoggedInUser || this.state.error;
    return (
      <React.Fragment>
        {error && (
          <MessageBox type="error" withIcon mb={4}>
            <strong>
              <FormattedMessage
                id="login.failed"
                defaultMessage="Sign In failed: {message}."
                values={{ message: error }}
              />
            </strong>
            <br />
            <FormattedMessage
              id="login.askAnother"
              defaultMessage="You can ask for a new sign in link using the form below."
            />
          </MessageBox>
        )}
        <SignInOrJoinFree redirect={next || '/'} initialForm={form} routes={SigninPage.routes} />
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

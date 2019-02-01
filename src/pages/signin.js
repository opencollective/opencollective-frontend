import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';

import { Router } from '../server/pages';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';

import { isValidRelativeUrl } from '../lib/utils';

import withIntl from '../lib/withIntl';
import { withUser } from '../components/UserProvider';
import Loading from '../components/Loading';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import MessageBox from '../components/MessageBox';

class SigninPage extends React.Component {
  static getInitialProps({ query: { token, next } }) {
    // Decode next URL if URI encoded
    if (next && next.startsWith('%2F')) {
      next = decodeURIComponent(next);
    }

    next = next && isValidRelativeUrl(next) ? next : null;
    return { token, next };
  }

  static propTypes = {
    token: PropTypes.string,
    next: PropTypes.string,
    login: PropTypes.func,
    errorLoggedInUser: PropTypes.string,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
  };

  state = { error: null, success: null };

  async componentDidMount() {
    if (this.props.token) {
      const user = await this.props.login(this.props.token);
      if (!user) {
        this.setState({ error: 'Token rejected' });
      }
    } else {
      this.props.login();
    }
  }
  async componentDidUpdate(oldProps) {
    if (!this.props.errorLoggedInUser && !oldProps.LoggedInUser && this.props.LoggedInUser) {
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
    if ((this.props.loadingLoggedInUser || this.state.success) && this.props.token) {
      return <Loading />;
    }

    const error = this.props.errorLoggedInUser || this.state.error;
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
        <SignInOrJoinFree redirect={this.props.next || '/'} />
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

export default withIntl(withUser(SigninPage));

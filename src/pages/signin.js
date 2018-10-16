import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import ErrorPage from '../components/ErrorPage';
import SignInForm from '../components/SignInForm';

import * as api from '../lib/api';
import { isValidUrl } from '../lib/utils';
import { Router } from '../server/pages';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

class SigninPage extends React.Component {
  static getInitialProps({ query: { token, next } }) {
    next = isValidUrl(next) && next.substr(0, 1) === '/' ? next : null;
    return { loginToken: token, next };
  }

  static propTypes = {
    loginToken: PropTypes.string,
    next: PropTypes.string,
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
  };

  constructor(props) {
    super(props);
    // Record the login error
    this.state = { error: null };
  }

  async componentDidMount() {
    const { loginToken, getLoggedInUser } = this.props;

    if (loginToken) {
      const { error, token } = await api.refreshToken(loginToken);
      if (error) {
        this.setState({ error, LoggedInUser: null });
        window.localStorage.removeItem('accessToken');
        window.localStorage.removeItem('LoggedInUser');
      } else {
        window.localStorage.setItem('accessToken', token);
        // We can't already fetch LoggedInUser
        // because Appollo client is already instanciated without the accessToken
        // so we just skip it
        // const LoggedInUser = await getLoggedInUser();
        // this.setState({ LoggedInUser });
        Router.pushRoute(this.props.next || '/');
      }
    } else {
      const LoggedInUser = await getLoggedInUser();
      if (LoggedInUser) {
        Router.pushRoute(this.props.next || '/');
      }
    }
  }

  render() {
    const { loginToken } = this.props;
    const { error } = this.state;

    if (loginToken && !error) {
      return <ErrorPage loading />;
    }

    return (
      <div className="LoginPage">
        <Header
          title="Sign Up"
          description="Create your profile on Open Collective and show the world the open collectives that you are contributing to."
        />
        <style jsx>
          {`
            .signin {
              max-width: 70rem;
              margin: 15rem auto;
              text-align: center;
            }
            h2 {
              font-size: 2rem;
              padding: 2rem;
            }
          `}
        </style>
        <Body>
          <div className="signin">
            {error && (
              <h1>Authentication Failed. Please try to login again.</h1>
            )}

            {(!loginToken || error) && (
              <Fragment>
                <h2>
                  <FormattedMessage
                    id="loginform.title"
                    defaultMessage="Sign in or Create an Account"
                  />
                </h2>
                <SignInForm next={this.props.next} />
              </Fragment>
            )}
          </div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withData(withIntl(withLoggedInUser(SigninPage)));

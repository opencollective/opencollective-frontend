import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import ErrorPage from '../components/ErrorPage';
import SignInForm from '../components/SignInForm';

import * as api from '../lib/api';
import { isValidUrl } from '../lib/utils';

import withIntl from '../lib/withIntl';

class SigninPage extends React.Component {
  static getInitialProps({ query: { token, next } }) {
    next = isValidUrl(next) && next.substr(0, 1) === '/' ? next : null;
    return { token, next };
  }

  static propTypes = {
    token: PropTypes.string,
    next: PropTypes.string,
  };

  constructor(props) {
    super(props);
    // Record the login error
    this.state = { error: null };
  }

  async componentDidMount() {
    if (this.props.token) {
      const { error, token } = await api.refreshToken(this.props.token);
      if (error) {
        this.setState({ error });
        console.log(error);
      } else {
        window.localStorage.setItem('accessToken', token);
        window.location.replace(this.props.next || '/');
      }
    }
  }

  render() {
    if (this.props.token && !this.state.error) {
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
            {this.state.error && (
              <h1>
                Authentication Failed. Please try to generate a new token.
              </h1>
            )}

            <h2>
              <FormattedMessage
                id="loginform.title"
                defaultMessage="Sign in or Create an Account"
              />
            </h2>
            <SignInForm next={this.props.next} />
          </div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default withIntl(SigninPage);

import React from 'react'

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import SignInForm from '../components/SignInForm';
import withIntl from '../lib/withIntl';
import { isValidUrl } from '../lib/utils';
import { FormattedMessage } from 'react-intl';
import * as api from '../lib/api';

class LoginPage extends React.Component {

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

  static getInitialProps ({ query: { token, next } }) {
    return { token, next: isValidUrl(next) && next.substr(0,1) === '/'  && next }
  }

  render() {
    if (this.props.token && !this.state.error) {
      return (<Loading />);
    }
    return (
      <div className="LoginPage">
        <Header
          title="Sign Up"
          description="Create your profile on Open Collective and show the world the open collectives that you are contributing to."
        />
        <style jsx>{`
        .signin {
          max-width: 60rem;
          margin: 15rem auto;
          text-align:center;
        }
        h2 {
          font-size: 2rem;
          padding: 2rem;
        }
        `}
        </style>
        <Body>
          <div className="signin">
            {this.state.error &&
             <h1>Authentication Failed. Please try to generate a new token.</h1>}

            <h2><FormattedMessage id="loginform.title" defaultMessage="Sign in or Create an Account" /></h2>
            <SignInForm next={this.props.next} />
          </div>
        </Body>
        <Footer />

      </div>
    )
  }
}

export default withIntl(LoginPage);

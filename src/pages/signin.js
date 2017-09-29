import React from 'react'

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import SignInForm from '../components/SignInForm';
import { Router } from '../server/pages';

class LoginPage extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (this.props.token) {
      window.localStorage.setItem('accessToken', this.props.token);
      const redirect = (this.props.next || '/');
      // This returns a Apollo/GraphQL error on production/staging env: Server response was missing for query 'undefined'
      // Somehow, it doesn't run the graphql query to fetch the collective data and therefore the 404 is thrown
      // Router.replaceRoute(redirect.replace(/^https?:\/\/[^\/]+/,''));
      window.location.replace(redirect);
    }
  }

  static getInitialProps ({ query: { token, next } }) {
    return { token, next }
  }

  render() {
    if (this.props.token) {
      return (<Loading />);
    }
    return (
      <div className="LoginPage">
        <Header />
        <style jsx>{`
        h1 {
          text-align:center;
          padding: 8rem;
        }
        `}
        </style>
        <Body>
          <SignInForm next={this.props.next} />
        </Body>
        <Footer />

      </div>
    )
  }
}

export default LoginPage;

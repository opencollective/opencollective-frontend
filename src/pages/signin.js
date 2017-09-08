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
    console.log(">>> props", this.props);    
    if (this.props.token) {
      window.localStorage.setItem('accessToken', this.props.token);
      const redirect = this.props.next || '/';
      Router.pushRoute(redirect.replace(/^https?:\/\/[^\/]+/,''));
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
          <SignInForm />
        </Body>
        <Footer />

      </div>
    )
  }
}

export default LoginPage;

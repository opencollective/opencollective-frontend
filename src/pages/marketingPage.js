import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

import sponsorPageHtml from '../static/sponsor-page/index.html';
import sponsorPageScript from '../static/sponsor-page/js/scripts.js';
import sponsorPageStyle from '../static/sponsor-page/css/styles.css';

class MarketingPage extends React.Component {
  static getInitialProps({ query: { pageSlug } }) {
    return { pageSlug };
  }

  static propTypes = {
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
    pageSlug: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    this.props.getLoggedInUser().then(LoggedInUser => {
      this.setState({ LoggedInUser });
    });
  }

  render() {
    const { pageSlug } = this.props;
    const { LoggedInUser } = this.state;

    let html, script, style, className;

    if (pageSlug === 'sponsor') {
      html = sponsorPageHtml;
      script = sponsorPageScript;
      style = sponsorPageStyle;
      className = 'sponsorPage';
    }

    return (
      <Fragment>
        <style global jsx>
          {style}
        </style>
        <div>
          <Header LoggedInUser={LoggedInUser} />
          <Body>
            <div
              className={className}
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <script type="text/javascript" src={script} />
          </Body>
          <Footer />
        </div>
      </Fragment>
    );
  }
}

export default withData(withIntl(withLoggedInUser(MarketingPage)));

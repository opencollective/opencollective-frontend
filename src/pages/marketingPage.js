import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

import { loadScriptAsync } from '../lib/utils';

import sponsorPageHtml from '../static/sponsor-page/index.html';
import sponsorPageScript from '../static/sponsor-page/js/scripts.js';
import sponsorPageStyle from '!css-loader!../static/sponsor-page/css/styles.css'; // eslint-disable-line

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

    if (this.props.pageSlug === 'become-a-sponsor') {
      loadScriptAsync(sponsorPageScript);
    }
  }

  render() {
    const { pageSlug } = this.props;
    const { LoggedInUser } = this.state;

    let html, style, className;

    if (pageSlug === 'become-a-sponsor') {
      html = sponsorPageHtml;
      style = sponsorPageStyle;
      className = 'sponsorPage';
    }

    return (
      <Fragment>
        <div>
          <Header LoggedInUser={LoggedInUser} />
          <Body>
            <style
              type="text/css"
              dangerouslySetInnerHTML={{ __html: style }}
            />
            <div
              className={className}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </Body>
          <Footer />
        </div>
      </Fragment>
    );
  }
}

export default withData(withIntl(withLoggedInUser(MarketingPage)));

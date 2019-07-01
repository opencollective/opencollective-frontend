import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';

import { loadScriptAsync } from '../lib/utils';

import sponsorPageHtml from '../static/sponsor-page/index.html';
import pricingPageHtml from '../static/pricing-page/index.html';
import howItWorksPageHtml from '../static/how-it-works-page/index.html';
import howItWorksPageHtmlFR from '../static/how-it-works-page/index.fr.html';
import holidayGiftCardPageHtml from '../static/holiday-gift-card/index.html';
import giftCardPageHtml from '../static/gift-cards-page/index.html';
import becomeAFiscalHostHtml from '../static/become-a-fiscal-host-page/index.html';

// hardcode loaders for specific files
import sponsorPageScript from '!file-loader?publicPath=/_next/static/js/&outputPath=static/js/&name=[name]-[hash].[ext]!../static/sponsor-page/js/scripts.js'; // eslint-disable-line
import sponsorPageStyle from '!css-loader!../static/sponsor-page/css/styles.css'; // eslint-disable-line
import pricingPageScript from '!file-loader?publicPath=/_next/static/javascripts/&outputPath=static/javascripts/&name=[name]-[hash].[ext]!../static/pricing-page/javascripts/scripts.js'; // eslint-disable-line
import pricingPageStyle from '!css-loader!../static/pricing-page/stylesheets/styles.css'; // eslint-disable-line
import howItWorksPageScript from '!file-loader?publicPath=/_next/static/js/&outputPath=static/js/&name=[name]-[hash].[ext]!../static/how-it-works-page/javascripts/scripts.js'; // eslint-disable-line
import howItWorksPageStyle from '!css-loader!../static/how-it-works-page/stylesheets/styles.css'; // eslint-disable-line
import holidayGiftCardPageStyle from '!css-loader!../static/holiday-gift-card/stylesheets/style.css'; // eslint-disable-line
import giftCardPageStyle from '!css-loader!../static/gift-cards-page/stylesheets/style.css'; // eslint-disable-line
import becomeAFiscalHostStyle from '!css-loader!../static/become-a-fiscal-host-page/stylesheets/styles.css'; // eslint-disable-line
import { withUser } from '../components/UserProvider';

class MarketingPage extends React.Component {
  static async getInitialProps({ req, query: { pageSlug } }) {
    const confirmationPage =
      req && req.method === 'POST' && (pageSlug === 'gift-of-giving' || pageSlug === 'gift-cards');
    return { pageSlug, confirmationPage };
  }

  static propTypes = {
    LoggedInUser: PropTypes.object,
    pageSlug: PropTypes.string.isRequired,
    confirmationPage: PropTypes.bool,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    this.loadScripts();
  }

  componentDidUpdate(prevProps) {
    if (this.props.pageSlug !== prevProps.pageSlug) {
      this.loadScripts();
    }
  }

  loadScripts() {
    if (this.props.pageSlug === 'become-a-sponsor') {
      loadScriptAsync(sponsorPageScript);
    } else if (this.props.pageSlug === 'how-it-works') {
      loadScriptAsync(howItWorksPageScript);
    } else if (this.props.pageSlug === 'pricing') {
      loadScriptAsync(pricingPageScript);
    }
  }

  render() {
    const { pageSlug, intl } = this.props;
    const { LoggedInUser } = this.props;

    let html, style, className;

    if (pageSlug === 'become-a-sponsor') {
      html = sponsorPageHtml;
      style = sponsorPageStyle;
      className = 'sponsorPage';
    } else if (pageSlug === 'pricing') {
      html = pricingPageHtml;
      style = pricingPageStyle;
      className = null;
    } else if (pageSlug === 'how-it-works') {
      if (intl.locale === 'fr') {
        html = howItWorksPageHtmlFR;
      } else {
        html = howItWorksPageHtml;
      }
      style = howItWorksPageStyle;
      className = 'mkt-page-how-it-works';
    } else if (pageSlug === 'gift-of-giving') {
      html = holidayGiftCardPageHtml;
      style = holidayGiftCardPageStyle;
      className = null;
    } else if (pageSlug === 'gift-cards') {
      html = giftCardPageHtml;
      style = giftCardPageStyle;
      className = null;
    } else if (pageSlug === 'become-a-fiscal-host') {
      html = becomeAFiscalHostHtml;
      style = becomeAFiscalHostStyle;
      className = 'mkt-page-become-a-fiscal-host';
    }

    return (
      <Fragment>
        <div>
          <Header LoggedInUser={LoggedInUser} />
          <Body>
            <style type="text/css" dangerouslySetInnerHTML={{ __html: style }} />
            <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
          </Body>
          <Footer />
        </div>
      </Fragment>
    );
  }
}

export default injectIntl(withUser(MarketingPage));

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import languages from '../lib/constants/locales';
import { loadScriptAsync } from '../lib/utils';

import Body from '../components/Body';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { withUser } from '../components/UserProvider';

import becomeAFiscalHostStyle from '!css-loader!../public/become-a-fiscal-host-page/stylesheets/styles.css'; // eslint-disable-line
import giftCardPageStyle from '!css-loader!../public/gift-cards-page/stylesheets/style.css'; // eslint-disable-line
import holidayGiftCardPageStyle from '!css-loader!../public/holiday-gift-card/stylesheets/style.css'; // eslint-disable-line
import howItWorksPageStyle from '!css-loader!../public/how-it-works-page/stylesheets/styles.css'; // eslint-disable-line
import sponsorPageStyle from '!css-loader!../public/sponsor-page/stylesheets/styles.css'; // eslint-disable-line

import howItWorksPageScript from '!file-loader?publicPath=/_next/static/js/&outputPath=static/js/&name=[name]-[hash].[ext]!../public/how-it-works-page/javascripts/scripts.js'; // eslint-disable-line
// hardcode loaders for specific files
import sponsorPageScript from '!file-loader?publicPath=/_next/static/js/&outputPath=static/js/&name=[name]-[hash].[ext]!../public/sponsor-page/javascripts/scripts.js'; // eslint-disable-line

const PAGES = {
  'how-it-works': {
    pageContents: importAll(require.context('../public/how-it-works-page', false, /\.(html)$/)),
    css: howItWorksPageStyle,
    js: howItWorksPageScript,
    className: 'mkt-page-how-it-works',
  },
  'gift-of-giving': {
    pageContents: importAll(require.context('../public/holiday-gift-card', false, /\.(html)$/)),
    css: holidayGiftCardPageStyle,
  },
  'gift-cards': {
    pageContents: importAll(require.context('../public/gift-cards-page', false, /\.(html)$/)),
    css: giftCardPageStyle,
    className: 'mkt-page-how-it-works',
  },
  'become-a-fiscal-host': {
    pageContents: importAll(require.context('../public/become-a-fiscal-host-page', false, /\.(html)$/)),
    css: becomeAFiscalHostStyle,
    className: 'mkt-page-become-a-fiscal-host',
  },
};

function importAll(r) {
  const map = {};
  r.keys().map(item => {
    map[item.replace('./', '')] = r(item);
  });
  return map;
}

function getmenuItem(pageSlug) {
  if (['how-it-works', 'pricing', 'become-a-sponsor', 'become-a-fiscal-host'].includes(pageSlug)) {
    return { pricing: true, howItWorks: true };
  } else {
    return { pricing: false, howItWorks: false };
  }
}

class MarketingPage extends React.Component {
  static getInitialProps({ query: { pageSlug } }) {
    return { pageSlug };
  }

  static propTypes = {
    LoggedInUser: PropTypes.object,
    pageSlug: PropTypes.string.isRequired,
    intl: PropTypes.object.isRequired,
  };

  async componentDidMount() {
    this.loadScripts();
  }

  componentDidUpdate(prevProps) {
    if (this.props.pageSlug !== prevProps.pageSlug) {
      this.loadScripts();
    }
  }

  loadScripts() {
    const page = PAGES[this.props.pageSlug];
    if (page && page.js) {
      loadScriptAsync(page.js);
    }
  }

  render() {
    const { pageSlug, intl } = this.props;
    const { LoggedInUser } = this.props;

    let html, style, className;
    const page = PAGES[pageSlug];

    if (page) {
      style = page.css;
      className = page.className;

      if (intl.locale != 'en' && languages[intl.locale]) {
        html = page.pageContents[`index.${intl.locale}.html`];
      }
      html = html || page.pageContents['index.html'];
    }

    return (
      <Fragment>
        <div>
          <Header LoggedInUser={LoggedInUser} menuItems={getmenuItem(pageSlug)} />
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

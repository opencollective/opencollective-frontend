import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import languages from '../lib/constants/locales';
import { loadScriptAsync } from '../lib/utils';

import Body from '../components/Body';
import Header from '../components/Header';
import Footer from '../components/navigation/Footer';
import { withUser } from '../components/UserProvider';

import giftCardPageStyle from '!css-loader!../public/gift-cards-page/stylesheets/style.css'; // eslint-disable-line
import holidayGiftCardPageStyle from '!css-loader!../public/holiday-gift-card/stylesheets/style.css'; // eslint-disable-line

const PAGES = {
  'gift-of-giving': {
    pageContents: importAll(require.context('../public/holiday-gift-card', false, /\.(html)$/)),
    css: holidayGiftCardPageStyle,
  },
  'gift-cards': {
    pageContents: importAll(require.context('../public/gift-cards-page', false, /\.(html)$/)),
    css: giftCardPageStyle,
    className: 'mkt-page-how-it-works',
  },
};

function importAll(r) {
  const map = {};
  r.keys().map(item => {
    map[item.replace('./', '')] = r(item);
  });
  return map;
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

      if (intl.locale !== 'en' && languages[intl.locale]) {
        html = page.pageContents[`index.${intl.locale}.html`];
      }
      html = html || page.pageContents['index.html'];
    }

    return (
      <Fragment>
        <div>
          <Header LoggedInUser={LoggedInUser} />
          <Body>
            {/* We control the pages content, since it's defined in markdown files we host in this codebase */}
            <style type="text/css" dangerouslySetInnerHTML={{ __html: style }} />
            <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
          </Body>
          <Footer />
        </div>
      </Fragment>
    );
  }
}

// ignore unused exports default
// next.js export
export default injectIntl(withUser(MarketingPage));

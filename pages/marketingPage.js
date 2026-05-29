import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import { getIntlProps } from '../lib/i18n/request';
import { loadScriptAsync } from '../lib/utils';

import Body from '../components/Body';
import Header from '../components/Header';
import Footer from '../components/navigation/Footer';
import { withUser } from '../components/UserProvider';

class MarketingPage extends React.Component {
  static async getInitialProps(ctx) {
    const { pageSlug } = ctx.query;
    const { locale } = getIntlProps(ctx);

    if (typeof window === 'undefined') {
      const { loadMarketingPageContent } = require('../lib/marketing-pages/load-content.server');
      const content = loadMarketingPageContent(pageSlug, locale);
      return {
        pageSlug,
        html: content?.html,
        css: content?.css,
        className: content?.className,
      };
    }

    const { loadMarketingPageContent } = await import('../lib/marketing-pages/load-content.client');
    const content = await loadMarketingPageContent(pageSlug, locale);
    return {
      pageSlug,
      html: content?.html,
      css: content?.css,
      className: content?.className,
    };
  }

  static propTypes = {
    LoggedInUser: PropTypes.object,
    pageSlug: PropTypes.string.isRequired,
    html: PropTypes.string,
    css: PropTypes.string,
    className: PropTypes.string,
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
    const { js } = this.props;
    if (js) {
      loadScriptAsync(js);
    }
  }

  render() {
    const { html, css, className, LoggedInUser } = this.props;

    return (
      <Fragment>
        <div>
          <Header LoggedInUser={LoggedInUser} />
          <Body>
            {/* We control the pages content, since it's defined in markdown files we host in this codebase */}
            {css && <style type="text/css" dangerouslySetInnerHTML={{ __html: css }} />}
            {html && <div className={className} dangerouslySetInnerHTML={{ __html: html }} />}
          </Body>
          <Footer />
        </div>
      </Fragment>
    );
  }
}

// next.js export
// ts-unused-exports:disable-next-line
export default injectIntl(withUser(MarketingPage));

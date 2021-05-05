import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import Head from 'next/head';
import { defineMessages, injectIntl } from 'react-intl';

import { getCollectiveImage } from '../lib/image-utils';
import { truncate } from '../lib/utils';

import TopBar from './TopBar';
import UserWarnings from './UserWarnings';

const messages = defineMessages({
  defaultTitle: {
    id: 'OC.tagline',
    defaultMessage: 'Make your community sustainable. Collect and spend money transparently.',
  },
});

class Header extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    canonicalURL: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    twitterHandle: PropTypes.string,
    css: PropTypes.string,
    className: PropTypes.string,
    title: PropTypes.string,
    showSearch: PropTypes.bool,
    withTopBar: PropTypes.bool,
    menuItems: PropTypes.object,
    /** If true, a no-robots meta will be added to the page */
    noRobots: PropTypes.bool,
    /** @ignore from injectIntl */
    intl: PropTypes.object,
  };

  static defaultProps = {
    withTopBar: true,
  };

  getTitle() {
    let title = this.props.title;

    if (!title) {
      if (this.props.collective) {
        title = this.props.collective.name;
      } else {
        title = `Open Collective - ${this.props.intl.formatMessage(messages.defaultTitle)}`;
      }
    }

    if (!title.match(/open collective/i)) {
      title = `${title} - Open Collective`;
    }

    return title;
  }

  getTwitterHandle() {
    const { collective } = this.props;
    const parentCollective = collective?.parentCollective;
    const handle = this.props.twitterHandle || collective?.twitterHandle || get(parentCollective, 'twitterHandle');
    return handle ? `@${handle}` : '';
  }

  getMetas() {
    const { noRobots, collective } = this.props;
    const title = this.props.title || (collective && collective.name);
    const image = this.props.image || (collective && getCollectiveImage(collective));
    const description = this.props.description || collective?.description || collective?.longDescription;
    const metaTitle = title ? `${title} - Open Collective` : 'Open Collective';
    const defaultImage = `https://opencollective.com/static/images/opencollective-og-default.png`;

    const metas = [
      { property: 'twitter:site', content: '@opencollect' },
      { property: 'twitter:creator', content: this.getTwitterHandle() },
      { property: 'fb:app_id', content: '266835577107099' },
      { property: 'og:image', content: image || defaultImage },
      { property: 'og:description', name: 'description', content: truncate(description, 256) },
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:title', content: metaTitle },
      { property: 'twitter:description', content: truncate(description, 256) },
      { property: 'twitter:image', content: image || defaultImage },
      { property: 'og:title', content: metaTitle },
    ];

    if (noRobots || (collective && collective.isIncognito)) {
      metas.push({ name: 'robots', content: 'none' });
    }

    return metas;
  }

  render() {
    const { css, className, canonicalURL, withTopBar } = this.props;
    return (
      <header>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          {/** Disable IE compatibility mode. See https://developer.paypal.com/docs/checkout/integrate/#2-add-the-paypal-javascript-sdk-to-your-web-page */}
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta property="og:logo" content="/static/images/opencollectiveicon240x240" size="240x240" />
          <meta property="og:logo" content="/static/images/opencollectiveicon48x48" size="48x48" />
          <meta property="og:logo" content="/static/images/opencollectivelogo480x80" size="480x80" />
          <meta property="og:logo" content="/static/images/opencollectivelogo480x80@2x" size="960x160" />
          {css && <link rel="stylesheet" href={css} />}
          <title>{this.getTitle()}</title>
          {this.getMetas().map((props, idx) => (
            // We use index in this `key` because their can be multiple meta for the same property (eg. og:image)
            // eslint-disable-next-line react/no-array-index-key
            <meta key={`${props.property || props.name}-${idx}`} {...props} />
          ))}
          {canonicalURL && <link rel="canonical" href={canonicalURL} />}
        </Head>
        <div id="top" />
        {withTopBar && (
          <TopBar className={className} showSearch={this.props.showSearch} menuItems={this.props.menuItems} />
        )}
        <UserWarnings />
      </header>
    );
  }
}

export default injectIntl(Header);

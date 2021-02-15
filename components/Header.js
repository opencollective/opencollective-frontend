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
    metas: PropTypes.object,
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

  getMetas() {
    const { noRobots, collective } = this.props;
    const title = this.props.title || (collective && collective.name);
    const image = this.props.image || (collective && getCollectiveImage(collective));
    const description =
      this.props.description || (collective && (collective.description || collective.longDescription));
    const twitterHandle =
      this.props.twitterHandle ||
      (collective && (collective.twitterHandle || get(collective.parentCollective, 'twitterHandle')));

    const metaTitle = title ? `${title} - Open Collective` : 'Open Collective';
    const defaultImage = `https://opencollective.com/static/images/opencollective-og-default.png`;

    const metas = {
      'twitter:site': '@opencollect',
      'twitter:creator': twitterHandle ? `@${twitterHandle}` : '',
      'fb:app_id': '266835577107099',
      'og:image': image || defaultImage,
      description: truncate(description, 256),
      'og:description': truncate(description, 256),
      'twitter:card': 'summary_large_image',
      'twitter:title': metaTitle,
      'twitter:description': truncate(description, 256),
      'twitter:image': image || defaultImage,
      'og:title': metaTitle,
      ...this.props.metas,
    };

    if (noRobots || (collective && collective.isIncognito)) {
      metas.robots = 'none';
    }

    return Object.keys(metas).map(key => ({ key, value: metas[key] }));
  }

  render() {
    const { css, className, canonicalURL, withTopBar } = this.props;
    return (
      <header>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <meta property="og:logo" content="/static/images/opencollectiveicon240x240" size="240x240" />
          <meta property="og:logo" content="/static/images/opencollectiveicon48x48" size="48x48" />
          <meta property="og:logo" content="/static/images/opencollectivelogo480x80" size="480x80" />
          <meta property="og:logo" content="/static/images/opencollectivelogo480x80@2x" size="960x160" />
          {css && <link rel="stylesheet" href={css} />}
          <title>{this.getTitle()}</title>
          {this.getMetas().map(({ key, value }) => (
            <meta property={key} content={value} key={`meta-${key}`} />
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

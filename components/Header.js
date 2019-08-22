import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import TopBar from './TopBar';

import { truncate, getQueryParams } from '../lib/utils';
import storage from '../lib/storage';

class Header extends React.Component {
  static propTypes = {
    canonicalURL: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    twitterHandle: PropTypes.string,
    css: PropTypes.string,
    className: PropTypes.string,
    title: PropTypes.string,
    showSearch: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    const { description, image, twitterHandle, title } = props;
    const metaTitle = title ? `${title} - Open Collective` : 'Open Collective';
    const defaultImage = 'https://opencollective.com/static/images/opencollective-og-default.jpg';
    const meta = {
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
    };

    this.meta = [];
    for (const name in meta) {
      this.meta.push({
        name,
        content: meta[name],
      });
    }
  }

  componentDidMount() {
    const urlParams = getQueryParams();
    if (urlParams.referral) {
      storage.set('referral', urlParams.referral, 48 * 60 * 60 * 1000); // we keep the referral for 48h or until we receive a new ?referral=
    }
  }

  render() {
    const { css, className, canonicalURL } = this.props;
    let title = this.props.title || 'Open Collective - open your finances to your community';
    if (!title.match(/open collective/i)) {
      title += ' - Open Collective';
    }
    return (
      <header>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta property="og:logo" content="/static/images/opencollectiveicon240x240" size="240x240" />
          <meta property="og:logo" content="/static/images/opencollectiveicon48x48" size="48x48" />
          <meta property="og:logo" content="/static/images/opencollectivelogo480x80" size="480x80" />
          <meta property="og:logo" content="/static/images/opencollectivelogo480x80@2x" size="960x160" />
          {css && <link rel="stylesheet" href={css} />}
          <title>{title}</title>
          {this.meta.map(({ name, content }) => (
            <meta property={name} content={content} key={`meta-${name}`} />
          ))}
          {canonicalURL && <link rel="canonical" href={canonicalURL} />}
        </Head>
        <div id="top" />
        <TopBar className={className} showSearch={this.props.showSearch} />
      </header>
    );
  }
}

export default Header;

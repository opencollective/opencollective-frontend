import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import App from 'next/app';
import Router from 'next/router';
import NProgress from 'nprogress';
import { ThemeProvider } from 'styled-components';
import { ApolloProvider } from 'react-apollo';

// For old browsers without window.Intl
import 'intl';
import 'intl/locale-data/jsonp/en.js';
import 'intl-pluralrules';
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/dist/locale-data/en';

import { IntlProvider } from 'react-intl';

import UserProvider from '../components/UserProvider';
import StripeProviderSSR from '../components/StripeProvider';
import withData from '../lib/withData';

import theme from '../lib/theme';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css'; // eslint-disable-line node/no-unpublished-import
import '../node_modules/nprogress/nprogress.css'; // eslint-disable-line node/no-unpublished-import
import '../static/styles/app.css';

Router.onRouteChangeStart = () => NProgress.start();

Router.onRouteChangeComplete = () => NProgress.done();

Router.onRouteChangeError = () => NProgress.done();

import { getGoogleMapsScriptUrl, loadGoogleMaps } from '../lib/google-maps';

class OpenCollectiveFrontendApp extends App {
  static propTypes = {
    pageProps: PropTypes.object.isRequired,
    initialNow: PropTypes.number.isRequired,
    scripts: PropTypes.object.isRequired,
    locale: PropTypes.string,
    messages: PropTypes.object,
  };

  static async getInitialProps({ Component, ctx }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = (await Component.getInitialProps(ctx)) || {};
    }

    const scripts = {};

    if (pageProps.scripts) {
      if (pageProps.scripts.googleMaps) {
        if (ctx.req) {
          scripts['google-maps'] = getGoogleMapsScriptUrl();
        } else {
          await loadGoogleMaps();
        }
      }
    }

    // Get react-intl data from props or local data if client side
    const { locale, messages } = ctx.req || window.__NEXT_DATA__.props;

    // Store server time to avoid React checksum mistmatch that could happen
    // with react-intl `FormattedRelative` when server and client time are different.
    // See https://github.com/formatjs/react-intl/issues/254
    const initialNow = Date.now();

    const digitalClimateStrikeParticipants = [
      'wwcodenyc',
      'visjs',
      'korerowellington',
      'debates',
      'hledger',
      'cljdoc',
      'streetlives',
      'javers',
      'dokku',
      'kitspace',
      'pytest',
      'terser',
      'ghost',
      'adnauseam',
      'opencollective',
      'opencollectiveinc',
      'engineering',
      'design',
    ];

    const digitalClimateStrikeOptions = {
      enabled: false,
      cookieExpirationDays: 30,
      disableGoogleAnalytics: true,
      showCloseButtonOnFullPageWidget: false,
      websiteName: 'Open Collective',
      iframeHost: 'https://oc-digital-climate-strike.now.sh',
    };

    if (!process.env.CI) {
      if (ctx.req && ctx.req.url === '/') {
        digitalClimateStrikeOptions.enabled = true;
      }
      if (pageProps.slug && digitalClimateStrikeParticipants.includes(pageProps.slug)) {
        digitalClimateStrikeOptions.enabled = true;
      }
      if (ctx.req && ctx.req.url.match(/\.html/)) {
        digitalClimateStrikeOptions.enabled = false;
      }
    }

    return { pageProps, scripts, initialNow, locale, messages, digitalClimateStrikeOptions };
  }

  render() {
    const {
      client,
      Component,
      pageProps,
      scripts,
      initialNow,
      locale,
      messages,
      digitalClimateStrikeOptions,
    } = this.props;

    return (
      <Fragment>
        <ApolloProvider client={client}>
          <ThemeProvider theme={theme}>
            <StripeProviderSSR>
              <IntlProvider initialNow={initialNow} locale={locale || 'en'} messages={messages}>
                <UserProvider apiKey={process.env.STRIPE_KEY}>
                  <Component {...pageProps} />
                </UserProvider>
              </IntlProvider>
            </StripeProviderSSR>
          </ThemeProvider>
        </ApolloProvider>
        {Object.keys(scripts).map(key => (
          <script key={key} type="text/javascript" src={scripts[key]} />
        ))}
        {digitalClimateStrikeOptions && digitalClimateStrikeOptions.enabled && (
          <Fragment>
            <script
              dangerouslySetInnerHTML={{
                __html: `var DIGITAL_CLIMATE_STRIKE_OPTIONS = ${JSON.stringify(digitalClimateStrikeOptions)};`,
              }}
            />
            <script type="text/javascript" src="/static/scripts/digitalclimatestrike.js?v=2" />
          </Fragment>
        )}
      </Fragment>
    );
  }
}

export default withData(OpenCollectiveFrontendApp);

import React from 'react';
import PropTypes from 'prop-types';
import App, { Container } from 'next/app';
import Router from 'next/router';
import NProgress from 'nprogress';
import { ThemeProvider } from 'styled-components';
import { ApolloProvider } from 'react-apollo';

// For old browsers without window.Intl
import 'intl';
import 'intl/locale-data/jsonp/en.js';

import { IntlProvider, addLocaleData } from 'react-intl';

import UserProvider from '../components/UserProvider';
import StripeProviderSSR from '../components/StripeProvider';
import withData from '../lib/withData';

import theme from '../lib/constants/theme';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css'; // eslint-disable-line node/no-unpublished-import
import '../node_modules/nprogress/nprogress.css'; // eslint-disable-line node/no-unpublished-import
import '../static/styles/app.css';

Router.onRouteChangeStart = () => NProgress.start();

Router.onRouteChangeComplete = () => NProgress.done();

Router.onRouteChangeError = () => NProgress.done();

import { getGoogleMapsScriptUrl, loadGoogleMaps } from '../lib/google-maps';

// Register React Intl's locale data for the user's locale in the browser. This
// locale data was added to the page by `pages/_document.js`. This only happens
// once, on initial page load in the browser.
if (typeof window !== 'undefined' && window.ReactIntlLocaleData) {
  Object.keys(window.ReactIntlLocaleData).forEach(lang => {
    addLocaleData(window.ReactIntlLocaleData[lang]);
  });
}

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

    return { pageProps, scripts, initialNow, locale, messages };
  }

  render() {
    const { client, Component, pageProps, scripts, initialNow, locale, messages } = this.props;

    return (
      <Container>
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
      </Container>
    );
  }
}

export default withData(OpenCollectiveFrontendApp);

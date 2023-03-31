import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { ApolloProvider } from '@apollo/client';
import App from 'next/app';
import Router from 'next/router';
import NProgress from 'nprogress';
import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import '../lib/dayjs'; // Import first to make sure plugins are initialized
import theme from '../lib/theme';
import withData from '../lib/withData';

import StripeProviderSSR from '../components/StripeProvider';
import TwoFactorAuthenticationModal from '../components/two-factor-authentication/TwoFactorAuthenticationModal';
import UserProvider from '../components/UserProvider';

import 'nprogress/nprogress.css';
import 'trix/dist/trix.css';
import '../public/static/styles/app.css';

Router.onRouteChangeStart = (url, { shallow }) => {
  if (!shallow) {
    NProgress.start();
  }
};

Router.onRouteChangeComplete = () => NProgress.done();

Router.onRouteChangeError = () => NProgress.done();

import { getGoogleMapsScriptUrl, loadGoogleMaps } from '../lib/google-maps';
import sentryLib from '../server/sentry';

import GlobalNewsAndUpdates from '../components/GlobalNewsAndUpdates';
import GlobalToasts from '../components/GlobalToasts';
import NewsAndUpdatesProvider from '../components/NewsAndUpdatesProvider';
import ToastProvider from '../components/ToastProvider';

// Use JSDOM on server-side so that react-intl can render rich messages
// See https://github.com/formatjs/react-intl/blob/c736c2e6c6096b1d5ad1fb6be85fa374891d0a6c/docs/Getting-Started.md#domparser
if (!process.browser) {
  global.DOMParser = new (require('jsdom').JSDOM)().window.DOMParser;
}

// This is optional but highly recommended
// since it prevents memory leak
const cache = createIntlCache();

class OpenCollectiveFrontendApp extends App {
  static propTypes = {
    pageProps: PropTypes.object.isRequired,
    scripts: PropTypes.object.isRequired,
    locale: PropTypes.string,
    messages: PropTypes.object,
  };

  constructor() {
    super(...arguments);
    this.state = { hasError: false, errorEventId: undefined };
  }

  static async getInitialProps({ Component, ctx, client }) {
    // Get the `locale` and `messages` from the request object on the server.
    // In the browser, use the same values that the server serialized.
    const { locale, messages } = ctx?.req || window.__NEXT_DATA__.props;
    const props = { pageProps: {}, scripts: {}, locale, messages };

    try {
      if (Component.getInitialProps) {
        props.pageProps = await Component.getInitialProps({ ...ctx, client });
      }

      if (props.pageProps.scripts) {
        if (props.pageProps.scripts.googleMaps) {
          if (ctx.req) {
            props.scripts['google-maps'] = getGoogleMapsScriptUrl();
          } else {
            try {
              await loadGoogleMaps();
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(e);
            }
          }
        }
      }
    } catch (error) {
      return { ...props, hasError: true, errorEventId: sentryLib.captureException(error, ctx) };
    }

    return props;
  }

  static getDerivedStateFromProps(props, state) {
    // If there was an error generated within getInitialProps, and we haven't
    // yet seen an error, we add it to this.state here
    return {
      hasError: props.hasError || state.hasError || false,
      errorEventId: props.errorEventId || state.errorEventId || undefined,
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorEventId = sentryLib.captureException(error, { errorInfo });
    this.setState({ hasError: true, errorEventId });
    super.componentDidCatch(error, errorInfo);
  }

  componentDidMount() {
    Router.events.on('routeChangeComplete', url => {
      if (window && window._paq) {
        if (url.match(/\/signin\/sent/)) {
          window._paq.push(['setCustomUrl', '/signin/sent']);
        } else {
          window._paq.push(['setCustomUrl', url]);
        }
        window._paq.push(['trackPageView']);
      }
    });
  }

  render() {
    const { client, Component, pageProps, scripts, locale, messages } = this.props;

    const intl = createIntl({ locale: locale || 'en', defaultLocale: 'en', messages }, cache);

    return (
      <Fragment>
        <ApolloProvider client={client}>
          <ThemeProvider theme={theme}>
            <StripeProviderSSR>
              <RawIntlProvider value={intl}>
                <ToastProvider>
                  <UserProvider>
                    <NewsAndUpdatesProvider>
                      <Component {...pageProps} />
                      <GlobalToasts />
                      <GlobalNewsAndUpdates />
                      <TwoFactorAuthenticationModal />
                    </NewsAndUpdatesProvider>
                  </UserProvider>
                </ToastProvider>
              </RawIntlProvider>
            </StripeProviderSSR>
          </ThemeProvider>
        </ApolloProvider>
        {Object.keys(scripts).map(key => (
          <script key={key} type="text/javascript" src={scripts[key]} />
        ))}
      </Fragment>
    );
  }
}

export default withData(OpenCollectiveFrontendApp);

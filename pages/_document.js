import '../env';

import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';
import flush from 'styled-jsx/server';
import { pick } from 'lodash';
import * as Sentry from '@sentry/browser';

import { parseToBoolean } from '../lib/utils';

process.on('unhandledRejection', err => {
  Sentry.captureException(err);
});

process.on('uncaughtException', err => {
  Sentry.captureException(err);
});

const clientAnalyticsEnabled = parseToBoolean(process.env.CLIENT_ANALYTICS_ENABLED);

// The document (which is SSR-only) needs to be customized to expose the locale
// data for the user's locale for React Intl to work in the browser.
export default class IntlDocument extends Document {
  static async getInitialProps(ctx) {
    const { locale, localeDataScript } = ctx.req;

    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      // The new recommended way to process Styled Components
      // unfortunately not compatible with styled-jsx as is
      // ctx.renderPage = () =>
      //   originalRenderPage({
      //     enhanceApp: App => props => sheet.collectStyles(<App {...props} />)
      //   })

      // The old recommended way to process Styled Components
      const page = originalRenderPage(App => props => sheet.collectStyles(<App {...props} />));

      const styledJsxStyles = flush();
      const styledComponentsStyles = sheet.getStyleElement();

      const initialProps = await Document.getInitialProps(ctx);

      return {
        ...initialProps,
        ...page,
        locale,
        localeDataScript,
        styles: (
          <React.Fragment>
            {initialProps.styles}
            {styledJsxStyles}
            {styledComponentsStyles}
          </React.Fragment>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  constructor(props) {
    super(props);
    // We pick the environment variables that we want to access from the client
    // They can later be read with getEnvVar()
    // Please, NEVER SECRETS!
    props.__NEXT_DATA__.env = pick(process.env, [
      'IMAGES_URL',
      'PAYPAL_ENVIRONMENT',
      'STRIPE_KEY',
      'SENTRY_DSN',
      'GOOGLE_MAPS_API_KEY',
      'RECAPTCHA_SITE_KEY',
      'RECAPTCHA_ENABLED',
    ]);
  }

  render() {
    return (
      <html>
        <Head />
        <body>
          <Main />
          <script
            dangerouslySetInnerHTML={{
              __html: this.props.localeDataScript,
            }}
          />
          <NextScript />
          {clientAnalyticsEnabled && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
            var _paq = window._paq || [];
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function() {
              var u="https://opencollective.matomo.cloud/";
              _paq.push(['setTrackerUrl', u+'matomo.php']);
              _paq.push(['setSiteId', '1']);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
              g.type='text/javascript'; g.async=true; g.defer=true; g.src='https://cdn.matomo.cloud/opencollective.matomo.cloud/matomo.js'; s.parentNode.insertBefore(g,s);
            })();
           `,
              }}
            />
          )}
        </body>
      </html>
    );
  }
}

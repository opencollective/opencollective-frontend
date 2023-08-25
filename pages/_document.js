import '../env';

import React from 'react';
import { pick } from 'lodash';
import Document, { Head, Html, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';
import { v4 as uuid } from 'uuid';

import { parseToBoolean } from '../lib/utils';
import { getCSPHeader } from '../server/content-security-policy';

const cspHeader = getCSPHeader();

// The document (which is SSR-only) needs to be customized to expose the locale
// data for the user's locale for React Intl to work in the browser.
export default class IntlDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    const clientAnalytics = {
      enabled: parseToBoolean(process.env.CLIENT_ANALYTICS_ENABLED),
      domain: process.env.CLIENT_ANALYTICS_DOMAIN,
      scriptSrc:
        'development' === process.env.OC_ENV
          ? 'https://plausible.io/js/script.tagged-events.exclusions.local.js'
          : 'https://plausible.io/js/script.tagged-events.exclusions.js',
      exclusions: process.env.CLIENT_ANALYTICS_EXCLUSIONS,
    };

    // On server-side, add a CSP header
    let requestNonce;
    if (ctx.res && cspHeader) {
      requestNonce = uuid();
      ctx.res.setHeader(cspHeader.key, cspHeader.value.replace('__OC_REQUEST_NONCE__', requestNonce));
    }

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: App => props => sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);

      return {
        ...initialProps,
        clientAnalytics,
        cspNonce: requestNonce,
        styles: (
          <React.Fragment>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </React.Fragment>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  constructor(props) {
    super(props);
    if (props.cspNonce) {
      props.__NEXT_DATA__.cspNonce = props.cspNonce;
    }
    // We pick the environment variables that we want to access from the client
    // They can later be read with getEnvVar()
    // Please, NEVER SECRETS!
    props.__NEXT_DATA__.env = pick(process.env, [
      'IMAGES_URL',
      'PAYPAL_ENVIRONMENT',
      'STRIPE_KEY',
      'SENTRY_DSN',
      'SENTRY_RELEASE',
      'WEBSITE_URL',
      'GOOGLE_MAPS_API_KEY',
      'RECAPTCHA_SITE_KEY',
      'RECAPTCHA_ENABLED',
      'WISE_ENVIRONMENT',
      'HCAPTCHA_SITEKEY',
      'CAPTCHA_ENABLED',
      'CAPTCHA_PROVIDER',
      'DISABLE_MOCK_UPLOADS',
    ]);
  }

  render() {
    return (
      <Html>
        <Head nonce={this.props.cspNonce} />
        <body>
          <Main nonce={this.props.cspNonce} />
          <script
            nonce={this.props.cspNonce}
            dangerouslySetInnerHTML={{
              __html: this.props.localeDataScript,
            }}
          />
          <NextScript nonce={this.props.cspNonce} />
          {this.props.clientAnalytics.enabled && (
            <script
              nonce={this.props.cspNonce}
              defer
              data-domain={this.props.clientAnalytics.domain}
              data-exclude={this.props.clientAnalytics.exclusions}
              src={this.props.clientAnalytics.scriptSrc}
            ></script>
          )}
        </body>
      </Html>
    );
  }
}

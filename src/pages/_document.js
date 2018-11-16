import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';
import flush from 'styled-jsx/server';
import './global-styles';

// The document (which is SSR-only) needs to be customized to expose the locale
// data for the user's locale for React Intl to work in the browser.
export default class IntlDocument extends Document {
  static async getInitialProps(context) {
    const props = await super.getInitialProps(context);
    const {
      req: { locale, localeDataScript },
      renderPage,
    } = context;

    const sheet = new ServerStyleSheet();
    const page = renderPage(App => props =>
      sheet.collectStyles(<App {...props} />),
    );
    const styleTags = sheet.getStyleElement();
    const styles = flush();

    return {
      ...props,
      ...page,
      locale,
      localeDataScript,
      styleTags,
      styles,
    };
  }

  constructor(props) {
    super(props);
    props.__NEXT_DATA__.env = {
      IMAGES_URL: process.env.IMAGES_URL || 'https://images.opencollective.com',
      PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
      STRIPE_KEY: process.env.STRIPE_KEY || 'pk_test_5aBB887rPuzvWzbdRiSzV3QB',
      GOOGLE_MAPS_API_KEY:
        process.env.GOOGLE_MAPS_API_KEY ||
        'AIzaSyCRLIexl7EkMQk_0_yNsjO4Vqb_MccD-RI',
      RECAPTCHA_SITE_KEY:
        process.env.RECAPTCHA_SITE_KEY ||
        '6LcyeXoUAAAAAFtdHDZfsxncFUkD9NqydqbIFcCK',
    };
  }

  render() {
    return (
      <html>
        <Head>{this.props.styleTags}</Head>
        <body>
          <Main />
          <script
            dangerouslySetInnerHTML={{
              __html: this.props.localeDataScript,
            }}
          />
          <NextScript />
        </body>
      </html>
    );
  }
}

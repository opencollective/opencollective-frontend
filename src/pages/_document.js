import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';
import flush from 'styled-jsx/server';
import { pick } from 'lodash';
import GlobalStyles from './global-styles';

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
    const page = renderPage(App => props => sheet.collectStyles(<App {...props} />));
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
    // We pick the environment variables that we want to access from the client
    // They can later be read with getEnvVar()
    // Please, NEVER SECRETS!
    props.__NEXT_DATA__.env = pick(process.env, [
      'IMAGES_URL',
      'PAYPAL_ENVIRONMENT',
      'STRIPE_KEY',
      'GOOGLE_MAPS_API_KEY',
      'RECAPTCHA_SITE_KEY',
      'SHOW_ARCHIVE_COLLECTIVE',
    ]);
  }

  render() {
    return (
      <html>
        <Head>{this.props.styleTags}</Head>
        <body>
          <GlobalStyles />
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

import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';
import './global-styles';

// The document (which is SSR-only) needs to be customized to expose the locale
// data for the user's locale for React Intl to work in the browser.
export default class IntlDocument extends Document {

  static async getInitialProps (context) {
    const props = await super.getInitialProps(context);
    const { req: { locale, localeDataScript }, renderPage } = context;

    const sheet = new ServerStyleSheet();
    const page = renderPage(App => props => sheet.collectStyles(<App {...props} />));
    const styleTags = sheet.getStyleElement();

    return {
      ...props,
      ...page,
      locale,
      localeDataScript,
      styleTags,
    };
  }

  constructor (props) {
    super(props);
    props.__NEXT_DATA__.env = {
      IMAGES_URL: process.env.IMAGES_URL || '',
    };
  }

  render () {
    // Polyfill Intl API for older browsers
    const scriptsUrls = {
      intl: `https://cdn.polyfill.io/v2/polyfill.min.js?features=Intl.~locale.${this.props.locale}`,
      stripe: "https://js.stripe.com/v3/",
      google: "https://maps.googleapis.com/maps/api/js?key=AIzaSyCRLIexl7EkMQk_0_yNsjO4Vqb_MccD-RI&libraries=places",
      paypalCheckout: "https://www.paypalobjects.com/api/checkout.js",
    };

    const scripts = [];
    const pathname = this.props.__NEXT_DATA__.pathname;

    const page = pathname.indexOf('/') !== -1
      ? pathname.substr(pathname.lastIndexOf('/') + 1)
      : pathname;

    const noScriptPages = ['nametags', 'events', 'events-iframe', 'collectives-iframe'];
    if (noScriptPages.indexOf(page) === -1) {
      const requiredScripts = Object.keys(scriptsUrls);
      requiredScripts.forEach(script => scripts.push(scriptsUrls[script]));
    }

    return (
      <html>
        <Head>
          {this.props.styleTags}
        </Head>
        <body>
          <Main />
          {scripts.map((script) => <script key={script} type="text/javascript" src={script} />)}
          {/* TODO: use the official react-stripe-elements; this is ugly */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
              if (typeof Stripe !== "undefined") {
                const stripePublishableKey = (typeof window !== "undefined" && (window.location.hostname === 'localhost' || window.location.hostname === 'staging.opencollective.com' || window.location.hostname === 'oc-aseem-dev-frontend.herokuapp.com')) ? 'pk_test_5aBB887rPuzvWzbdRiSzV3QB' : 'pk_live_qZ0OnX69UlIL6pRODicRzsZy';
                // eslint-disable-next-line
                stripe = Stripe(stripePublishableKey);
              }
              `
            }}
            />
          <script
            dangerouslySetInnerHTML={{
              __html: this.props.localeDataScript
            }}
            />
          <NextScript />
        </body>
      </html>
    )
  }
}

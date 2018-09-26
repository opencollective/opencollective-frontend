import React from 'react';
import App, { Container } from 'next/app';

import { getGoogleMapsScriptUrl, loadGoogleMaps } from '../lib/google-maps';

export default class OpenCollectiveFrontendApp extends App {
  static async getInitialProps({ Component, ctx }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
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

    return { pageProps, scripts };
  }

  render() {
    const { Component, pageProps, scripts } = this.props;

    return (
      <Container>
        <Component {...pageProps} />
        {Object.keys(scripts).map(key => (
          <script key={key} type="text/javascript" src={scripts[key]} />
        ))}
      </Container>
    );
  }
}

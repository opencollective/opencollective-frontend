import React from 'react';
import App, { Container } from 'next/app';
import Router from 'next/router';
import NProgress from 'nprogress';
import { ThemeProvider } from 'styled-components';

import theme from '../constants/theme';

import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../../node_modules/font-awesome/css/font-awesome.min.css';
import '../../node_modules/nprogress/nprogress.css';
import '../styles/app.css';

Router.onRouteChangeStart = () => NProgress.start();

Router.onRouteChangeComplete = () => NProgress.done();

Router.onRouteChangeError = () => NProgress.done();

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
        <ThemeProvider theme={theme}>
          <Component {...pageProps} />
        </ThemeProvider>
        {Object.keys(scripts).map(key => (
          <script key={key} type="text/javascript" src={scripts[key]} />
        ))}
      </Container>
    );
  }
}

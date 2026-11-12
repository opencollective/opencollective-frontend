import React, { Fragment } from 'react';
import { ApolloProvider } from '@apollo/client';
import { polyfill as PolyfillInterweaveSSR } from 'interweave-ssr';
import App from 'next/app';
import Router from 'next/router';
import NProgress from 'nprogress';
import { StyleSheetManager, ThemeProvider } from 'styled-components';

import '../lib/dayjs'; // Import first to make sure plugins are initialized
import '../lib/analytics/plausible';
import { ApplyDocumentFont, inter } from '../lib/fonts';
import { API_V1_CONTEXT } from '../lib/graphql/helpers';
import { getIntlProps } from '../lib/i18n/request';
import theme from '../lib/theme';
import defaultColors from '../lib/theme/colors';

import DefaultPaletteStyle from '../components/DefaultPaletteStyle';
import StripeProviderSSR from '../components/StripeProvider';
import TwoFactorAuthenticationModal from '../components/two-factor-authentication/TwoFactorAuthenticationModal';
import { Toaster } from '../components/ui/Toaster';
import UserProvider from '../components/UserProvider';
import { WorkspaceProvider } from '../components/WorkspaceProvider';

import 'nprogress/nprogress.css';
import 'trix/dist/trix.css';
import '../public/static/styles/app.css';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

const LegacyRouter = Router as typeof Router & {
  onRouteChangeStart: (url: string, options: { shallow?: boolean }) => void;
  onRouteChangeComplete: () => void;
  onRouteChangeError: () => void;
};

LegacyRouter.onRouteChangeStart = (url, { shallow }) => {
  if (!shallow) {
    NProgress.start();
  }
};

LegacyRouter.onRouteChangeComplete = () => NProgress.done();

LegacyRouter.onRouteChangeError = () => NProgress.done();

import { getDataFromTree } from '@apollo/client/react/ssr';
import { mergeDeep } from '@apollo/client/utilities';
import memoizeOne from 'memoize-one';

import { APOLLO_STATE_PROP_NAME, initClient } from '../lib/apollo-client';
import { getTokenFromCookie } from '../lib/auth';
import { forceFullPageLoad } from '../lib/full-page-load';
import { getGoogleMapsScriptUrl, loadGoogleMaps } from '../lib/google-maps';
import { loggedInUserQuery } from '../lib/graphql/v1/queries';
import { WhitelabelProviderContext } from '../lib/hooks/useWhitelabel';
import LoggedInUser from '../lib/LoggedInUser';
import { withTwoFactorAuthentication } from '../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import type { WhitelabelProps } from '../lib/whitelabel';
import { getWhitelabelProps } from '../lib/whitelabel';
import { defaultShouldForwardProp } from '@/lib/styled_components_utils';
import sentryLib, { Sentry } from '../server/sentry';

import GlobalNewsAndUpdates from '../components/GlobalNewsAndUpdates';
import IntlProvider from '../components/intl/IntlProvider';
import { ModalProvider } from '../components/ModalContext';
import NewsAndUpdatesProvider from '../components/NewsAndUpdatesProvider';
import { TooltipProvider } from '../components/ui/Tooltip';

if (typeof window === 'undefined') {
  PolyfillInterweaveSSR();
}

type AppPageProps = {
  skipDataFromTree?: boolean;
  whitelabel?: { provider?: WhitelabelProps['provider'] };
  scripts?: { googleMaps?: boolean };
  [key: string]: unknown;
};

type AppProps = {
  Component: React.ComponentType<Record<string, unknown>>;
  pageProps: AppPageProps;
  scripts: Record<string, string>;
  locale?: string;
  messages?: Record<string, string>;
  LoggedInUserData?: Record<string, unknown>;
  hasError?: boolean;
  errorEventId?: string;
  twoFactorAuthContext?: unknown;
  apolloClient?: ReturnType<typeof initClient>;
};

type AppInitialProps = {
  pageProps: AppPageProps;
  scripts: Record<string, string>;
  locale?: string;
  messages?: Record<string, string>;
  LoggedInUserData?: Record<string, unknown>;
  hasError?: boolean;
  errorEventId?: string;
};

class OpenCollectiveFrontendApp extends App<AppProps> {
  state = { hasError: false, errorEventId: undefined };

  static async getInitialProps({ AppTree, Component, ctx }) {
    const apolloClient = initClient({
      accessToken: getTokenFromCookie(ctx.req),
    });

    if (ctx.req) {
      ctx.req.apolloClient = apolloClient;
    }

    const props: AppInitialProps = {
      pageProps: { skipDataFromTree: true, whitelabel: getWhitelabelProps(ctx) },
      scripts: {},
      ...getIntlProps(ctx),
    };

    try {
      if (Component.getInitialProps) {
        props.pageProps = { ...(await Component.getInitialProps({ ...ctx })), whitelabel: props.pageProps.whitelabel };
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

    if (typeof window === 'undefined' && ctx.req.cookies.enableAuthSsr) {
      if (getTokenFromCookie(ctx.req)) {
        try {
          const result = await apolloClient.query({
            query: loggedInUserQuery,
            context: API_V1_CONTEXT,
            fetchPolicy: 'network-only',
          });
          props.LoggedInUserData = result.data.LoggedInUser;
        } catch (err) {
          Sentry.captureException(err);
        }
      }

      try {
        await getDataFromTree(<AppTree {...props} apolloClient={apolloClient} />);
      } catch (err) {
        Sentry.captureException(err);
      }
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
    const errorEventId = sentryLib.captureException(error, { errorInfo: { ...errorInfo } });
    this.setState({ hasError: true, errorEventId });
  }

  componentDidMount() {
    Router.events.on('routeChangeStart', forceFullPageLoad);
    Router.events.on('routeChangeComplete', url => {
      const paq = (window as Window & { _paq?: Array<unknown[]> })._paq;
      if (paq) {
        if (url.match(/\/signin\/sent/)) {
          paq.push(['setCustomUrl', '/signin/sent']);
        } else {
          paq.push(['setCustomUrl', url]);
        }
        paq.push(['trackPageView']);
      }
    });

    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('ssr apollo cache', window?.__NEXT_DATA__?.props?.[APOLLO_STATE_PROP_NAME]);
    }
  }

  getApolloClient = memoizeOne((ssrCache, pageServerSidePropsCache) => {
    return initClient({
      initialState: mergeDeep(ssrCache || {}, pageServerSidePropsCache || {}),
      twoFactorAuthContext: this.props.twoFactorAuthContext,
    });
  });

  render() {
    const { Component, pageProps, scripts, locale, LoggedInUserData } = this.props;

    if (
      typeof window !== 'undefined' &&
      process.env.NODE_ENV === 'development' &&
      pageProps?.[APOLLO_STATE_PROP_NAME]
    ) {
      // eslint-disable-next-line no-console
      console.log('pageProps apollo cache', pageProps?.[APOLLO_STATE_PROP_NAME]);
    }

    return (
      <Fragment>
        <ApplyDocumentFont>
          <div className={`${inter.variable} ${inter.className}`}>
            <ApolloProvider
              client={
                this.props.apolloClient ||
                this.getApolloClient(
                  typeof window !== 'undefined' ? window?.__NEXT_DATA__?.props?.[APOLLO_STATE_PROP_NAME] : {},
                  pageProps?.[APOLLO_STATE_PROP_NAME],
                )
              }
            >
              <StyleSheetManager shouldForwardProp={defaultShouldForwardProp}>
                <ThemeProvider theme={theme}>
                  <StripeProviderSSR>
                    <IntlProvider locale={locale}>
                      <TooltipProvider delayDuration={500} skipDelayDuration={100}>
                        <UserProvider
                          initialLoggedInUser={LoggedInUserData ? new LoggedInUser(LoggedInUserData) : null}
                        >
                          <WhitelabelProviderContext.Provider value={pageProps?.whitelabel?.provider}>
                            <WorkspaceProvider>
                              <ModalProvider>
                                <NewsAndUpdatesProvider>
                                  <Component {...pageProps} />
                                  <Toaster />
                                  <GlobalNewsAndUpdates />
                                  <TwoFactorAuthenticationModal />
                                </NewsAndUpdatesProvider>
                              </ModalProvider>
                            </WorkspaceProvider>
                          </WhitelabelProviderContext.Provider>
                        </UserProvider>
                      </TooltipProvider>
                    </IntlProvider>
                  </StripeProviderSSR>
                </ThemeProvider>
              </StyleSheetManager>
            </ApolloProvider>
          </div>
        </ApplyDocumentFont>
        <DefaultPaletteStyle palette={defaultColors.primary} />
        {Object.keys(scripts).map(key => (
          <script key={key} type="text/javascript" src={scripts[key]} />
        ))}
      </Fragment>
    );
  }
}

// next.js export
// ts-unused-exports:disable-next-line
// ts-unused-exports:disable-next-line
export default withTwoFactorAuthentication(OpenCollectiveFrontendApp);

import React from 'react';
import { polyfill as PolyfillInterweaveSSR } from 'interweave-ssr';
import { cookies } from 'next/headers';

import '../lib/dayjs'; // Import first to make sure plugins are initialized
import '../lib/analytics/plausible';
import { queryWithToken } from '../lib/ApolloClient';
import { loggedInUserQuery } from '../lib/graphql/v1/queries';

import ClientApolloProvider from '../components/ApolloProvider';

import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'nprogress/nprogress.css';
import '@opencollective/trix/dist/trix.css';
import '../public/static/styles/app.css';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

if (typeof window === 'undefined') {
  PolyfillInterweaveSSR();
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieData = await cookies();
  const accessTokenPayload = cookieData.get('accessTokenPayload');
  const accessTokenSignature = cookieData.get('accessTokenSignature');

  const accessToken =
    accessTokenPayload && accessTokenSignature ? [accessTokenPayload, accessTokenSignature].join('.') : null;

  // Get locale information
  const locale = cookieData.get('language')?.value || 'en';

  // Fetch logged in user data if token exists and SSR is enabled
  if (accessToken && cookieData.get('enableAuthSsr')?.value) {
    try {
      // Use the queryWithToken function for server-side queries with authentication
      await queryWithToken({
        query: loggedInUserQuery,
        fetchPolicy: 'network-only',
        accessToken,
      });
      // User data is now cached in Apollo client for hydration
    } catch {
      // Silently handle error - user will need to re-authenticate on client side
    }
  }

  return (
    <html lang={locale}>
      <body>
        <ClientApolloProvider>
          {/* <StyleSheetManager shouldForwardProp={defaultShouldForwardProp}> */}
          {/* <ThemeProvider theme={theme}> */}
          {/* <StripeProviderSSR> */}
          {/* <SSRIntlProvider intl={intl}>
            <IntlProvider locale={locale}>
              <TooltipProvider delayDuration={500} skipDelayDuration={100}> */}
          {/* <UserContext.Provider
            value={
              {
                loadingLoggedInUser: false,
                errorLoggedInUser: null,
                LoggedInUser: loggedInUserData ? new LoggedInUser(loggedInUserData) : null,
                logout: async () => null,
                login: async () => null,
                async refetchLoggedInUser() {},
                updateLoggedInUserFromCache: () => {},
              } as any
            }
          > */}
          {/* <WorkspaceProvider> */}
          {/* <ModalProvider> */}
          {children}
          {/* <Toaster />
                      <TwoFactorAuthenticationModal /> */}
          {/* </ModalProvider> */}
          {/* </WorkspaceProvider> */}
          {/* </UserContext.Provider> */}
          {/* </TooltipProvider>
            </IntlProvider>
          </SSRIntlProvider> */}
          {/* </StripeProviderSSR> */}
          {/* </ThemeProvider> */}
          {/* </StyleSheetManager> */}
        </ClientApolloProvider>
        {/* <DefaultPaletteStyle palette={defaultColors.primary} /> */}
      </body>
    </html>
  );
}

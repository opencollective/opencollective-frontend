import React from 'react';
import type { ApolloClient } from '@apollo/client';
import { ApolloProvider } from '@apollo/client';
import { get } from 'lodash-es';
import { IntlProvider } from 'react-intl';
import { type DefaultTheme, ThemeProvider } from 'styled-components';

import { initClient } from '../lib/apollo-client';
import theme from '../lib/theme';

import { TooltipProvider } from '../components/ui/Tooltip';

const apolloClient = initClient();

/**
 * `getLocaleMessages` is async (webpack dynamic import); tests need the messages synchronously.
 * `jest.requireActual` loads the same JSON file through jest's resolver.
 */
const getTestLocaleMessages = (locale: string): Record<string, string> => jest.requireActual(`../lang/${locale}.json`);

type ProvidersParams = {
  IntlProvider?: { locale?: string };
  ApolloProvider?: { client?: ApolloClient<object> };
  ThemeProvider?: { theme?: DefaultTheme };
};

/**
 * A helper to wrap component under all required OC's providers
 *
 * @param component - the component to render
 * @param providerParams - parameters to give to the providers:
 *   - IntlProvider: { locale }
 *   - ThemeProvider: { theme }
 */
export const withRequiredProviders = (component: React.ReactNode, providersParams: ProvidersParams = {}) => {
  const locale: string = get(providersParams, 'IntlProvider.locale', 'en');
  const client: ApolloClient<object> = get(providersParams, 'ApolloProvider.client', apolloClient);
  const themeArg: DefaultTheme = get(providersParams, 'ThemeProvider.theme', theme);
  return (
    <IntlProvider locale={locale} messages={locale === 'en' ? undefined : getTestLocaleMessages(locale)}>
      <ApolloProvider client={client}>
        <TooltipProvider delayDuration={0} skipDelayDuration={0}>
          <ThemeProvider theme={themeArg}>{component}</ThemeProvider>
        </TooltipProvider>
      </ApolloProvider>
    </IntlProvider>
  );
};

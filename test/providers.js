import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { get } from 'lodash';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import { initClient } from '../lib/apollo-client';
import theme from '../lib/theme';
import * as Intl from '../server/intl';

const apolloClient = initClient();

/**
 * A helper to wrap component under all required OC's providers
 *
 * @param {ReactNode} component - the component to render
 * @param {Object} providerParams - parameters to give to the providers:
 *    - IntlProvider: { locale }
 *    - ThemeProvider: { theme }
 */
export const withRequiredProviders = (component, providersParams = {}) => {
  const locale = get(providersParams, 'IntlProvider.locale', 'en');
  return (
    <IntlProvider locale={locale} messages={locale === 'en' ? undefined : Intl.getMessages(locale)}>
      <ApolloProvider client={get(providersParams, 'ApolloProvider.client', apolloClient)}>
        <ThemeProvider theme={get(providersParams, 'ThemeProvider.theme', theme)}>{component}</ThemeProvider>
      </ApolloProvider>
    </IntlProvider>
  );
};

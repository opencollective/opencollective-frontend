import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { get } from 'lodash';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import { initClient } from '../lib/apollo-client';
import { getLocaleMessages } from '../lib/i18n/request';
import theme from '../lib/theme';

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
  const locale = get(providersParams, 'IntlProvider.locale', 'fr');
  return (
    <IntlProvider locale={locale} messages={locale === 'fr' ? undefined : getLocaleMessages(locale)}>
      <ApolloProvider client={get(providersParams, 'ApolloProvider.client', apolloClient)}>
        <ThemeProvider theme={get(providersParams, 'ThemeProvider.theme', theme)}>{component}</ThemeProvider>
      </ApolloProvider>
    </IntlProvider>
  );
};

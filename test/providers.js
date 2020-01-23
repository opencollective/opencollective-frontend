import React from 'react';
import { get } from 'lodash';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';
import { ApolloProvider } from 'react-apollo';
import theme from '../lib/theme';
import initClient from '../lib/initClient';
import { getMessages } from '../server/intl';

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
    <IntlProvider locale={locale} messages={locale === 'en' ? undefined : getMessages(locale)}>
      <ApolloProvider client={get(providersParams, 'ApolloProvider.client', apolloClient)}>
        <ThemeProvider theme={get(providersParams, 'ThemeProvider.theme', theme)}>{component}</ThemeProvider>
      </ApolloProvider>
    </IntlProvider>
  );
};

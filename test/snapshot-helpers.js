import React from 'react';
import renderer from 'react-test-renderer';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';
import { get } from 'lodash';
import 'intl';
import 'intl/locale-data/jsonp/en.js';
import 'intl-pluralrules';
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/dist/locale-data/en';
import '@formatjs/intl-relativetimeformat/dist/locale-data/fr';
import theme from '../lib/theme';
import * as Intl from '../server/intl';

/**
 * A helper to:
 *  1. Wrap component under all required OC's providers
 *  2. Render the tree
 *  3. Compare with snapshot
 *
 * @param {ReactNode} component - the component to render
 * @param {Object} providerParams - parameters to give to the providers:
 *    - IntlProvider: { locale }
 *    - ThemeProvider: { theme }
 */
export const snapshot = (component, providersParams = {}) => {
  let messages;
  const locale = get(providersParams, 'IntlProvider.locale', 'en');
  if (locale !== 'en') {
    messages = Intl.getMessages(locale);
  }

  const tree = renderer
    .create(
      <IntlProvider locale={locale} messages={messages}>
        <ThemeProvider theme={get(providersParams, 'ThemeProvider.theme', theme)}>{component}</ThemeProvider>
      </IntlProvider>,
    )
    .toJSON();
  return expect(tree).toMatchSnapshot();
};

/**
 * @deprecated Use `snapshot`
 * Same as `snapshot` but wraps component in a IntlProvider
 */
export const snapshotI18n = (component, locale = 'en') => {
  const tree = renderer.create(<IntlProvider locale={locale}>{component}</IntlProvider>).toJSON();
  return expect(tree).toMatchSnapshot();
};

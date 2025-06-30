import React from 'react';
import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { withRequiredProviders } from './providers';

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
  const componentWithProviders = withRequiredProviders(component, providersParams);
  const { container } = render(componentWithProviders);
  return expect(container).toMatchSnapshot();
};

/**
 * Same as `snapshot` but removes all `className` from the tree
 */
export const snapshotWithoutClassNames = (component, providersParams = {}) => {
  const componentWithProviders = withRequiredProviders(component, providersParams);
  const { container } = render(componentWithProviders);

  /**
   * @param {HTMLElement} node
   */
  const removeClassName = node => {
    if (node.hasAttribute('class')) {
      node.removeAttribute('class');
    }

    if (node.children) {
      for (const child of node.children) {
        removeClassName(child);
      }
    }
  };

  removeClassName(container);
  return expect(container).toMatchSnapshot();
};

/**
 * @deprecated Use `snapshot`
 * Same as `snapshot` but wraps component in a IntlProvider
 */
export const snapshotI18n = (component, locale = 'en') => {
  const { container } = render(<IntlProvider locale={locale}>{component}</IntlProvider>);
  return expect(container).toMatchSnapshot();
};

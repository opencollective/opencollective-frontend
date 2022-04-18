import renderer from 'react-test-renderer';

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
  const tree = renderer.create(componentWithProviders).toJSON();
  return expect(tree).toMatchSnapshot();
};

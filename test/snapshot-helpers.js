import React from 'react';
import renderer from 'react-test-renderer';
import { IntlProvider } from 'react-intl';

export const snapshot = component => {
  const tree = renderer.create(component).toJSON();
  return expect(tree).toMatchSnapshot();
};

/**
 * Same as `snapshot` but wraps component in a IntlProvider
 */
export const snapshotI18n = component => {
  const tree = renderer.create(<IntlProvider locale="en">{component}</IntlProvider>).toJSON();
  return expect(tree).toMatchSnapshot();
};

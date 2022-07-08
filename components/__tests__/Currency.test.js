import React from 'react';

import { snapshot } from '../../test/snapshot-helpers';

import Currency from '../Currency';

describe('Currency', () => {
  it('renders default options', () => {
    snapshot(<Currency value={4200} currency="USD" />);
    snapshot(<Currency value={1900000} currency="USD" />, { IntlProvider: { locale: 'fr' } });
    snapshot(<Currency value={4221} currency="JPY" />);
  });

  it('currency format with separators', () => {
    snapshot(<Currency formatWithSeparators value={4200} currency="USD" />);
    snapshot(<Currency formatWithSeparators value={1900000} currency="USD" />, { IntlProvider: { locale: 'fr' } });
    snapshot(<Currency formatWithSeparators value={1900000} currency="USD" />, { IntlProvider: { locale: 'en' } });
  });

  it('overrides precision if amount is below 100 for decimal currency', () => {
    snapshot(<Currency value={99} currency="USD" />);
  });

  it('rounds amount if value is below 100 for zero decimal currency', () => {
    snapshot(<Currency value={99} currency="JPY" />);
    snapshot(<Currency value={22} currency="JPY" />);
  });
});

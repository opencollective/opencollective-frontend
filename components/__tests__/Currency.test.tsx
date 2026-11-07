import React from 'react';

import { Currency as CurrencyEnum } from '../../lib/graphql/types/v2/graphql';
import { snapshot } from '../../test/snapshot-helpers';

import Currency from '../Currency';

describe('Currency', () => {
  it('renders default options', () => {
    snapshot(<Currency value={4200} currency={CurrencyEnum.USD} />);
    snapshot(<Currency value={1900000} currency={CurrencyEnum.USD} />, { IntlProvider: { locale: 'fr' } });
  });

  it('currency format with separators', () => {
    snapshot(<Currency formatWithSeparators value={4200} currency={CurrencyEnum.USD} />);
    snapshot(<Currency formatWithSeparators value={1900000} currency={CurrencyEnum.USD} />, {
      IntlProvider: { locale: 'fr' },
    });
    snapshot(<Currency formatWithSeparators value={1900000} currency={CurrencyEnum.USD} />, {
      IntlProvider: { locale: 'en' },
    });
  });
});

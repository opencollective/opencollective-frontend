import { createIntl } from 'react-intl';

import { getCountryDisplayName } from '../i18n/countries';

describe('getCountryDisplayName', () => {
  it('resolves the country name in the locale of the provided intl instance', () => {
    const frName = getCountryDisplayName(createIntl({ locale: 'fr' }), 'US');
    const enName = getCountryDisplayName(createIntl({ locale: 'en' }), 'US');

    expect(frName).toBe(new Intl.DisplayNames('fr', { type: 'region' }).of('US'));
    expect(enName).toBe(new Intl.DisplayNames('en', { type: 'region' }).of('US'));
    expect(frName).not.toBe(enName);
  });
});

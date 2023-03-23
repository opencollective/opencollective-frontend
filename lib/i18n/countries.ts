import { countryData, getEmojiByCountryCode } from 'country-currency-emoji-flags';
import { IntlShape } from 'react-intl';

import { getIntlDisplayNames } from '.';

export function getFlagEmoji(countryCode: string) {
  return getEmojiByCountryCode(countryCode);
}

export const isoCountryList = Object.keys(countryData);

export function getCountryDisplayName(intl: IntlShape, countryCode: string) {
  const regionNames = getIntlDisplayNames(intl, 'region');
  return regionNames.of(countryCode);
}

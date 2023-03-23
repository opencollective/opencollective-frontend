import { IntlShape } from 'react-intl';

import { getIntlDisplayNames } from '.';

export function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function getCountryDisplayName(intl: IntlShape, countryCode: string) {
  const regionNames = getIntlDisplayNames(intl, 'region');
  return regionNames.of(countryCode);
}

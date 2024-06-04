import { getEmojiByCountryCode } from 'country-currency-emoji-flags';
import type { IntlShape } from 'react-intl';

import { getIntlDisplayNames } from '.';

export function getFlagEmoji(countryCode: string) {
  return getEmojiByCountryCode(countryCode);
}

export function getCountryDisplayName(intl: IntlShape, countryCode: string) {
  const regionNames = getIntlDisplayNames(intl, 'region');
  return regionNames.of(countryCode);
}

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

export function getCountryCodeFromLocalBrowserLanguage() {
  if (typeof navigator === 'undefined' || !navigator.language) {
    return null;
  }
  const language = navigator.language;
  const countryCode = language.split('-')[1];
  return countryCode ? countryCode.toUpperCase() : null;
}

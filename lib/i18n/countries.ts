import { getEmojiByCountryCode } from 'country-currency-emoji-flags';
import type { IntlShape } from 'react-intl';

import { getIntlDisplayNames } from '.';

export function getFlagEmoji(countryCode: string) {
  return getEmojiByCountryCode(countryCode);
}

export function getCountryDisplayName(intl: IntlShape, countryCode: string) {
  const regionNames = getIntlDisplayNames(intl.locale, 'region');
  return regionNames.of(countryCode);
}

/**
 * PayPal uses a few country codes that are not ISO 3166-1 alpha-2 compliant.
 * See https://developer.paypal.com/reference/country-codes/
 */
const PAYPAL_COUNTRY_CODE_TO_ISO: Record<string, string> = {
  C2: 'CN', // China
};

/**
 * Translates a PayPal country code to ISO 3166-1 alpha-2. Returns `null` if the code
 * is missing or is not a valid region code, so callers can safely fall back to "Unknown".
 */
export function normalizePayPalCountryCode(intl: IntlShape, countryCode?: string | null): string | null {
  const code = countryCode?.trim().toUpperCase();
  if (!code) {
    return null;
  }

  const isoCode = PAYPAL_COUNTRY_CODE_TO_ISO[code] || code;
  if (!/^[A-Z]{2}$/.test(isoCode)) {
    return null;
  }

  try {
    // `of` returns the code itself when the region is unknown
    const displayName = getIntlDisplayNames(intl.locale, 'region').of(isoCode);
    return displayName && displayName !== isoCode ? isoCode : null;
  } catch {
    return null;
  }
}

export function getCountryCodeFromLocalBrowserLanguage() {
  if (typeof navigator === 'undefined' || !navigator.language) {
    return null;
  }
  const language = navigator.language;
  const countryCode = language.split('-')[1];
  return countryCode ? countryCode.toUpperCase() : null;
}

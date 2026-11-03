import type { IntlShape } from 'react-intl';

type DisplayNamesLike = { of: (value: string) => string | undefined };

/**
 * A dummy polyfill for `Intl.DisplayNames`. If falling back to the default string is not an acceptable option
 * feel free to add a [real polyfill](https://formatjs.io/docs/polyfills/intl-displaynames/) and remove this helper.
 */
export const getIntlDisplayNames = (
  locale: string,
  type: Intl.DisplayNamesOptions['type'],
): Intl.DisplayNames | DisplayNamesLike => {
  try {
    return new Intl.DisplayNames(locale, { type });
  } catch {
    return { of: (str: string) => str };
  }
};

export const i18nCountryName = (intl: IntlShape, countryCode: string): string | undefined => {
  const countryNames = getIntlDisplayNames(intl.locale || 'en', 'region');
  return countryNames.of(countryCode);
};

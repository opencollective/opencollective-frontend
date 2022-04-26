/**
 * A dummy polyfill for `Intl.DisplayNames`. If falling back to the default string is not an acceptable option
 * feel free to add a [real polyfill](https://formatjs.io/docs/polyfills/intl-displaynames/) and remove this helper.
 */
export const getIntlDisplayNames = (locale, type) => {
  try {
    return new Intl.DisplayNames(locale, { type });
  } catch {
    return { of: str => str };
  }
};

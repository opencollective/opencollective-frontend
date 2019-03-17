/**
 * Fetch user geolocation from third party API. It is only meant to be used on
 * client side. If called from server side, this function returns null;
 *
 * @returns countryCode: {string} two-letters ISO code or null if any error occurs
 */
const fetchGeoLocation = async () => {
  if (!process.browser) {
    return null;
  }

  try {
    const response = await fetch('https://wtfismyip.com/json');
    const body = await response.json();
    return body.YourFuckingCountryCode;
  } catch (e) {
    // Ignore errors
    return null;
  }
};

export default fetchGeoLocation;

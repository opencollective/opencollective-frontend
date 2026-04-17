/**
 * Fetch user geolocation using the browser's Geolocation API.
 * It is only meant to be used on client side. If called from server side,
 * this function returns null.
 *
 * Uses the standard browser Geolocation API to get coordinates, then
 * uses the Nominatim service to reverse geocode coordinates to country code.
 *
 * @returns countryCode: {string} two-letters ISO code or null if any error occurs
 */
const fetchGeoLocation = async () => {
  if (!process.browser || !navigator.geolocation) {
    return null;
  }

  try {
    // Get position using browser Geolocation API
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    });

    const { latitude, longitude } = position.coords;

    // Use Nominatim service for reverse geocoding (OpenStreetMap-based, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'OpenCollective/1.0',
        },
      },
    );

    const data = await response.json();
    return data.address?.country_code?.toUpperCase() || null;
  } catch {
    // Ignore errors
    return null;
  }
};

export default fetchGeoLocation;

import { get } from 'lodash';

import { loadScriptAsync } from './utils';
import { getEnvVar } from './env-utils';

const getGoogleMapsScriptUrl = () => {
  const apiKey = getEnvVar('GOOGLE_MAPS_API_KEY');
  return `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
};

const loadGoogleMapsAsync = () =>
  new Promise((resolve, reject) => {
    const callbackName = '_googleMapsInitializeCallback';

    window[callbackName] = () => {
      resolve();
    };

    loadScriptAsync(`${getGoogleMapsScriptUrl()}&callback=${callbackName}`).catch(err => {
      reject(err);
    });
  });

const loadGoogleMaps = async () => {
  if (typeof window == 'undefined') {
    return;
  }
  if (get(window, 'google.maps.places.AutocompleteService')) {
    return;
  }
  const googleMapsApiKey = getEnvVar('GOOGLE_MAPS_API_KEY');
  if (!googleMapsApiKey) {
    throw new Error("'GOOGLE_MAPS_API_KEY' is undefined.");
  } else {
    await loadGoogleMapsAsync(googleMapsApiKey);
  }
};

export { getGoogleMapsScriptUrl, loadGoogleMaps };

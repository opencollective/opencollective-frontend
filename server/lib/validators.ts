/**
 * Define custom validators
 */

// --- Validators for videos ---

type RegexMap = { [s: string]: RegExp };

const ProvidersRegexs: RegexMap = {
  YouTube: /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i,
  Vimeo: /:\/\/(www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|)(\d+)(?:|\/\?)/i,
};

/** A list of video provider names that we support on Open Collective */
export const supportedVideoProviders = Object.keys(ProvidersRegexs);

/**
 * This function ensures that a given URL points toward a video from a video
 * provider that we support. It mostly mirrors (and should match) the ones that
 * we have in `frontend/src/components/VideoPlayer.js`
 *
 * Returns `false` if `url` is null, undefined or empty.
 */
export const isSupportedVideoProvider = (url: string): boolean => {
  if (!url) {
    return false;
  }

  return supportedVideoProviders.some(providerName => {
    return ProvidersRegexs[providerName].test(url);
  });
};

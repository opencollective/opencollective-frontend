import config from 'config';
import cloudflare from 'cloudflare';

import logger from './logger';

// Load config
const cfConfig = config.cloudflare || {};

// Check config
const isLiveServer = ['staging', 'production'].includes(config.env);
const hasConfig = Boolean(cfConfig.email && cfConfig.key && cfConfig.zone);

if (isLiveServer && !hasConfig) {
  logger.warn('Your Cloudflare config is imcomplete, you must provide an email, a key and a zone');
} else if (!isLiveServer && hasConfig) {
  logger.info('A Cloudflare config was provided on a Live/Test environment. Some methods will be stubbed.');
}

const CloudflareLib = cloudflare({ email: cfConfig.email, key: cfConfig.key });

// Export some helpers

/**
 * Purge the given page from cloudflare's cache. In dev environments this function
 * will only log to the console and will skip the call to cloudflare.
 *
 * @param {string|array} pagePaths - a path or an array of paths `/eslint`, `['/', '/about']`
 * @returns {Promise}
 */
export const purgeCacheForPage = pagePaths => {
  const prepareURL = pagePath => {
    const prependSlash = pagePath[0] === '/' ? '' : '/';
    return `${config.host.website}${prependSlash}${pagePath}`;
  };

  const urlsToPurge = Array.isArray(pagePaths) ? pagePaths.map(prepareURL) : [prepareURL(pagePaths)];
  logger.info(`Asking cloudflare to purge the cache for ${urlsToPurge}`);

  if (!isLiveServer || !hasConfig) {
    return Promise.resolve({ success: true, errors: [], messages: [], result: {} });
  }

  return CloudflareLib.zones.purgeCache(cfConfig.zone, { files: urlsToPurge }).catch(logger.error);
};

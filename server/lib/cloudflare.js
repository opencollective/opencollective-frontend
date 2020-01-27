import config from 'config';
import cloudflare from 'cloudflare';

import logger from './logger';

// Load config
const cfConfig = config.cloudflare || {};

// Check config
const isLiveServer = ['staging', 'production'].includes(config.env);
const hasConfig = Boolean(cfConfig.email && cfConfig.key && cfConfig.zone);

if (isLiveServer && !hasConfig) {
  logger.warn('Cloudflare config is incomplete: it must includes an email, a key and a zone');
} else if (!isLiveServer && hasConfig) {
  logger.info('A Cloudflare config was provided on a Live/Test environment. Some methods will be stubbed.');
}

const CloudflareLib = cloudflare({ email: cfConfig.email, key: cfConfig.key });

// Export some helpers

/**
 * Purge the given page from cloudflare's cache. In dev environments this function
 * will only log to the console and will skip the call to cloudflare.
 *
 * Don't include the trailing `/` in `pagePaths`, a second version of the URL with
 * it is already generated automatically. We do that because Cloudflare consider
 * `https://opencollective.com/babel` and `https://opencollective.com/babel/` as two
 * different URLs.
 *
 * @param {string|array} pagePaths - a path or an array of paths `/eslint`, `['/', '/about']`
 * @returns {Promise}
 */
export const purgeCacheForPage = pagePaths => {
  const addPage = (urls, pagePath) => {
    const prependSlash = pagePath[0] === '/' ? '' : '/';
    urls.push(`${config.host.website}${prependSlash}${pagePath}`);
    urls.push(`${config.host.website}${prependSlash}${pagePath}/`);
    if (config.host.frontend) {
      urls.push(`${config.host.frontend}${prependSlash}${pagePath}`);
      urls.push(`${config.host.frontend}${prependSlash}${pagePath}/`);
    }
  };

  const urlsToPurge = [];
  if (Array.isArray(pagePaths)) {
    pagePaths.forEach(page => addPage(urlsToPurge, page));
  } else {
    addPage(urlsToPurge, pagePaths);
  }

  if (!isLiveServer || !hasConfig) {
    return Promise.resolve({ success: true, errors: [], messages: [], result: {} });
  }

  logger.info(`Asking cloudflare to purge the cache for ${urlsToPurge}`);

  return CloudflareLib.zones.purgeCache(cfConfig.zone, { files: urlsToPurge }).catch(logger.error);
};

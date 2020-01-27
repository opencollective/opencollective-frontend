import algoliasearch from 'algoliasearch';
import config from 'config';
import { has } from 'lodash';

import logger from './logger';

function checkConfig(keys = []) {
  let configOk = true;

  for (const configKey of keys) {
    if (!has(config, ['algolia', configKey])) {
      logger.info(`Missing Algolia config: ${configKey}`);
      configOk = false;
    }
  }

  return configOk;
}

function getClient() {
  if (!checkConfig(['appId', 'appKey'])) {
    return;
  }
  return algoliasearch(config.algolia.appId, config.algolia.appKey);
}

function getIndex() {
  const client = getClient();
  if (client) {
    if (!checkConfig(['index'])) {
      return;
    }
    return client.initIndex(config.algolia.index);
  }
}

/** Returns true if Algolia is configured and usable */
function isAvailable() {
  return Boolean(getClient());
}

export default {
  getIndex,
  isAvailable,
};

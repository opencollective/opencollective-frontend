import config from 'config';
import clearbit from 'clearbit';
import { get } from 'lodash';

import logger from '../lib/logger';

let clearbitKey = get(config, 'clearbit.key');
if (!clearbitKey) {
  clearbitKey = 'UNDEFINED_CLEARBIT_KEY';
  logger.warn('Missing clearbit config: key (CLEARBIT_KEY)');
}

export default clearbit(clearbitKey);

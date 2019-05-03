import '../server/env';

import config from 'config';
import { get } from 'lodash';

import { getDBConf } from '../server/lib/db';

const dbConfig = getDBConf('database');

export default {
  ...dbConfig,
  dialectOptions: get(config.database.options, 'dialectOptions', {}),
};

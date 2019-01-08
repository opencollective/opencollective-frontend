import '../server/env';

import { getDBConf } from '../server/lib/db';

const dbConfig = getDBConf('database');

export default {
  ...dbConfig,
  operatorsAliases: false,
};

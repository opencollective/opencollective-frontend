import '../server/env';

import * as forest from '../server/lib/forest';

if (!process.env.FOREST_ENV_SECRET || !process.env.FOREST_AUTH_SECRET) {
  console.log('Please set FOREST_ENV_SECRET and FOREST_AUTH_SECRET');
  process.exit();
}

forest.init();

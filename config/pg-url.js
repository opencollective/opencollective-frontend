import '../server/env';

import { getDBUrl } from '../server/lib/db';

console.log(getDBUrl('database'));

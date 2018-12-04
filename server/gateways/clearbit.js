import config from 'config';
import clearbit from 'clearbit';
import { get } from 'lodash';

let clearbitKey = get(config, 'clearbit.key');
if (!clearbitKey) {
  clearbitKey = 'UNDEFINED_CLEARBIT_KEY';
  console.warn('Missing Clearbit config: key (CLEARBIT_KEY)');
}

export default clearbit(clearbitKey);

import config from 'config';
import clearbit from 'clearbit';

export default clearbit(config.clearbit);

// Load environment variables
import debug from 'debug';
import dotenv from 'dotenv';

dotenv.config();
debug.enable(process.env.DEBUG);

// Only load newrelic when we explicitly want it
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

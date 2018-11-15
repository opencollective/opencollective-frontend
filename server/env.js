import debug from 'debug';
import dotenv from 'dotenv';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

if (['production', 'circleci'].indexOf(process.env.NODE_ENV) === -1) {
  dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
}

debug.enable(process.env.DEBUG);

// Only load newrelic when we explicitly want it
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

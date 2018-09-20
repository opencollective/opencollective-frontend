import 'babel-polyfill';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

if (['production', 'circleci'].indexOf(process.env.NODE_ENV) === -1) {
  const dotenv = require('dotenv');
  dotenv.config(); // this loads .env with real values. It needs to be first because dotenv doesn't overwrite any values
  dotenv.config({ path: 'default.env' }); // this loads the default file in github with dummy values
}

// Only load newrelic when we explicitly want it
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const debug = require('debug');
const dotenv = require('dotenv');
const lodash = require('lodash');

// Load extra env file on demand
// e.g. `npm run dev production` -> `.env.production`
const extraEnv = process.env.EXTRA_ENV || lodash.last(process.argv);
const extraEnvPath = path.join(__dirname, `.env.${extraEnv}`);
if (fs.existsSync(extraEnvPath)) {
  dotenv.config({ path: extraEnvPath });
}

dotenv.config();
debug.enable(process.env.DEBUG);

const defaults = {
  PORT: 3000,
  NODE_ENV: 'development',
  HOSTNAME: 'localhost',
  API_KEY: '09u624Pc9F47zoGLlkg1TBSbOl2ydSAq',
  API_URL: 'https://api-staging.opencollective.com',
  IMAGES_URL: 'https://images-staging.opencollective.com',
  WEBSITE_URL: 'http://localhost:3000',
  REST_URL: 'https://rest-staging.opencollective.com',
  PDF_SERVICE_URL: 'https://pdf-staging.opencollective.com',
  ML_SERVICE_URL: 'https://ml.opencollective.com',
  DISABLE_MOCK_UPLOADS: false,
  PAYPAL_ENVIRONMENT: 'sandbox',
  STRIPE_KEY: 'pk_test_VgSB4VSg2wb5LdAkz7p38Gw8',
  GOOGLE_MAPS_API_KEY: 'AIzaSyAZJnIxtBw5bxnu2QoCUiLCjV1nk84Vnk0',
  RECAPTCHA_SITE_KEY: '6LcyeXoUAAAAAFtdHDZfsxncFUkD9NqydqbIFcCK',
  HCAPTCHA_SITEKEY: '10000000-ffff-ffff-ffff-000000000001',
  OCF_DUPLICATE_FLOW: false,
  TURNSTILE_SITEKEY: '0x4AAAAAAAS6okaJ_ThVJqYq',
  CAPTCHA_ENABLED: false,
  CAPTCHA_PROVIDER: 'HCAPTCHA',
  CLIENT_ANALYTICS_ENABLED: false,
  CLIENT_ANALYTICS_DOMAIN: 'localhost',
  CLIENT_ANALYTICS_EXCLUSIONS: '/**/banner.html, /**/contribute/button, /**/donate/button',
  WISE_PLATFORM_COLLECTIVE_SLUG: 'opencollective-host',
  OC_APPLICATION: 'frontend',
  OC_ENV: process.env.NODE_ENV || 'development',
  OC_SECRET: crypto.randomBytes(16).toString('hex'),
  WISE_ENVIRONMENT: 'sandbox',
  API_PROXY: true,
  SENTRY_TRACES_SAMPLE_RATE: null,
  LEDGER_SEPARATE_TAXES_AND_PAYMENT_PROCESSOR_FEES: false,
};

if ((process.env.OC_ENV || process.env.NODE_ENV || 'production') === 'production') {
  defaults.PAYPAL_ENVIRONMENT = 'production';
  defaults.WISE_ENVIRONMENT = 'production';
}

if ((process.env.OC_ENV || process.env.NODE_ENV || 'development') === 'development') {
  defaults.GRAPHQL_BENCHMARK = true;
}

if (['production', 'staging'].includes(process.env.OC_ENV)) {
  defaults.API_PROXY = false;
  defaults.WISE_PLATFORM_COLLECTIVE_SLUG = 'opencollective';
}

if (['e2e'].includes(process.env.OC_ENV)) {
  defaults.API_URL = 'http://localhost:3060';
  defaults.API_KEY = 'dvl-1510egmf4a23d80342403fb599qd';
}

for (const key in defaults) {
  if (process.env[key] === undefined) {
    process.env[key] = defaults[key];
  }
}

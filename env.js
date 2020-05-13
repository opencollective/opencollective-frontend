const crypto = require('crypto');

const debug = require('debug');
const dotenv = require('dotenv');

dotenv.config();
debug.enable(process.env.DEBUG);

const defaults = {
  PORT: 3000,
  NODE_ENV: 'development',
  API_KEY: '09u624Pc9F47zoGLlkg1TBSbOl2ydSAq',
  API_URL: 'https://api-staging.opencollective.com',
  IMAGES_URL: 'https://images-staging.opencollective.com',
  WEBSITE_URL: 'http://localhost:3000',
  PDF_SERVICE_URL: 'https://invoices-staging.opencollective.com',
  PAYPAL_ENVIRONMENT: 'sandbox',
  STRIPE_KEY: 'pk_test_VgSB4VSg2wb5LdAkz7p38Gw8',
  GOOGLE_MAPS_API_KEY: 'AIzaSyCRLIexl7EkMQk_0_yNsjO4Vqb_MccD-RI',
  RECAPTCHA_SITE_KEY: '6LcyeXoUAAAAAFtdHDZfsxncFUkD9NqydqbIFcCK',
  RECAPTCHA_ENABLED: false,
  CLIENT_ANALYTICS_ENABLED: false,
  ONBOARDING_MODAL: false,
  TRANSFERWISE_ENABLED: true,
  NEW_HOST_APPLICATION_FLOW: false,
  TW_API_COLLECTIVE_SLUG: 'opencollective-host',
  OC_APPLICATION: 'frontend',
  OC_ENV: process.env.NODE_ENV || 'development',
  OC_SECRET: crypto.randomBytes(16).toString('hex'),
};

if (process.env.NODE_ENV === 'production') {
  defaults.TW_API_COLLECTIVE_SLUG = 'opencollectiveinc';
}

if (process.env.NODE_ENV === 'e2e') {
  defaults.API_URL = 'http://localhost:3060';
  defaults.API_KEY = 'dvl-1510egmf4a23d80342403fb599qd';
}

for (const key in defaults) {
  if (process.env[key] === undefined) {
    process.env[key] = defaults[key];
  }
}

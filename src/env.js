import debug from 'debug';
import dotenv from 'dotenv';

dotenv.config();
debug.enable(process.env.DEBUG);

const defaults = {
  PORT: 3000,
  NODE_ENV: 'development',
  API_KEY: '09u624Pc9F47zoGLlkg1TBSbOl2ydSAq',
  API_URL: 'https://api-staging.opencollective.com',
  IMAGES_URL: 'https://images-staging.opencollective.com',
  WEBSITE_URL: 'http://localhost:3000',
  INVOICES_URL: 'https://invoices-staging.opencollective.com',
  GIFTCARDS_GENERATOR_URL: 'https://giftcards-generator-staging.opencollective.com',
  PAYPAL_ENVIRONMENT: 'sandbox',
  STRIPE_KEY: 'pk_test_5aBB887rPuzvWzbdRiSzV3QB',
  GOOGLE_MAPS_API_KEY: 'AIzaSyCRLIexl7EkMQk_0_yNsjO4Vqb_MccD-RI',
  RECAPTCHA_SITE_KEY: '6LcyeXoUAAAAAFtdHDZfsxncFUkD9NqydqbIFcCK',
  RECAPTCHA_ENABLED: false,
  SHOW_ARCHIVE_COLLECTIVE: true,
  SHOW_DELETE_COLLECTIVE: true,
  SHOW_EMPTY_BALANCE_COLLECTIVE: true,
};

for (const key in defaults) {
  if (process.env[key] === undefined) {
    process.env[key] = defaults[key];
  }
}

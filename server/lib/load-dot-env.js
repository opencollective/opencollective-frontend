/**
 * Load .env file
 */
if (process.env.NODE_ENV === 'development') {
  require('dotenv').load();
}

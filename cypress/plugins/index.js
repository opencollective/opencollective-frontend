require('dotenv').config();

function parseToBoolean(value) {
  let lowerValue = value;
  // check whether it's string
  if (lowerValue && (typeof lowerValue === 'string' || lowerValue instanceof String)) {
    lowerValue = lowerValue.trim().toLowerCase();
  }
  if (['on', 'enabled', '1', 'true', 'yes', 1].includes(lowerValue)) {
    return true;
  }
  return false;
}

// eslint-disable-next-line
module.exports = (on, config) => {
  config.baseUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
  config.env = config.env || {};
  config.env.USE_NEW_CREATE_ORDER = parseToBoolean(process.env.USE_NEW_CREATE_ORDER);
  return config;
};

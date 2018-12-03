// eslint-disable-next-line
module.exports = (on, config) => {
  config.baseUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
  return config;
};

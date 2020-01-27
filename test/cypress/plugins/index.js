require('dotenv').config();

// eslint-disable-next-line
module.exports = (on, config) => {
  // eslint-disable-next-line node/no-unpublished-require
  on('task', require('@cypress/code-coverage/task'));

  on('before:browser:launch', (browser = {}, args) => {
    if (browser.name === 'chrome') {
      args.push('--lang=en-US');
      return args;
    }
  });

  config.baseUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
  config.env = config.env || {};
  return config;
};

// eslint-disable-next-line node/no-unpublished-import
import { defineConfig } from 'cypress';

export default defineConfig({
  viewportWidth: 1200,
  viewportHeight: 1660,
  projectId: 'yt5kwm',
  defaultCommandTimeout: 15000,
  responseTimeout: 60000,
  video: false,
  chromeWebSecurity: false,
  scrollBehavior: 'center',
  blockHosts: [
    'wtfismyip.com',
    'images.opencollective.com',
    'images-staging.opencollective.com',
    'localhost:3001',
  ],
  env: {
    MAILDEV_URL: 'http://localhost:1080',
    codeCoverage: {
      url: '/__coverage__',
    },
  },
  fixturesFolder: 'test/cypress/fixtures',
  screenshotsFolder: 'test/cypress/screenshots',
  videosFolder: 'test/cypress/videos',
  e2e: {
    setupNodeEvents(on, config) {
      // eslint-disable-next-line node/no-unpublished-require
      require('@cypress/code-coverage/task')(on, config);

      on('before:browser:launch', (browser: { name: string }, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--lang=en-US');
        }
      });

      config.baseUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
      config.env = config.env || {};

      return config;
    },
    specPattern: 'test/cypress/integration',
    supportFile: 'test/cypress/support/index.js',
    baseUrl: 'http://localhost:3000',
  },
})

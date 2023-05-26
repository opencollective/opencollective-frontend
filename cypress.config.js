// eslint-disable-next-line node/no-unpublished-require
const { defineConfig } = require('cypress');
const fs = require('fs');
const { getTextFromPdfContent } = require('./test/cypress/scripts/get-text-from-pdf-content.ts');

module.exports = defineConfig({
  experimentalMemoryManagement: true,
  viewportWidth: 1200,
  viewportHeight: 1660,
  projectId: 'yt5kwm',
  defaultCommandTimeout: 15000,
  responseTimeout: 60000,
  video: true,
  chromeWebSecurity: false,
  scrollBehavior: 'center',
  blockHosts: ['wtfismyip.com', 'images.opencollective.com', 'images-staging.opencollective.com', 'localhost:3001'],
  env: {
    MAILDEV_URL: 'http://localhost:1080',
    codeCoverage: {
      url: '/__coverage__',
    },
  },
  fixturesFolder: 'test/cypress/fixtures',
  screenshotsFolder: 'test/cypress/screenshots',
  videosFolder: 'test/cypress/videos',
  downloadsFolder: 'test/cypress/downloads',
  e2e: {
    setupNodeEvents(on, config) {
      // eslint-disable-next-line node/no-unpublished-require
      require('@cypress/code-coverage/task')(on, config);

      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--lang=en-US');
        }
      });

      on('task', {
        // Allows to log messages from a test using `cy.task('log', 'message')`
        log(...message) {
          console.log(...message); // eslint-disable-line no-console
          return null;
        },
        getTextFromPdfContent,
      });

      // Delete videos if the test succeeds
      on('after:spec', (spec, results) => {
        if (results && results.video) {
          // Do we have failures for any retry attempts?
          const failures = results.tests.some(test => test.attempts.some(attempt => attempt.state === 'failed'));
          if (!failures) {
            // delete the video if the spec passed and no tests retried
            fs.unlinkSync(results.video);
          }
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
});

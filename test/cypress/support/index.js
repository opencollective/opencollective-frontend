// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import '@cypress/code-coverage/support';
import 'cypress-real-events';
// Import commands.js using ES2015 syntax:
import './commands';
import './typed-commands';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('cypress-terminal-report/src/installLogsCollector')({
  xhr: {
    printRequestData: true,
  },
});

// See https://github.com/opencollective/opencollective/issues/2676
Cypress.on('uncaught:exception', (err, runnable, promise) => {
  if (err.message.includes('Cannot clear timer: timer created with')) {
    // See https://github.com/cypress-io/cypress/issues/3170
    // Ignore this error
    return false;
  } else if (/ResizeObserver loop limit exceeded/.test(err.message)) {
    // Generated in `useElementSize`
    // As per https://stackoverflow.com/a/50387233, this one can safely be ignored
    return false;
  } else if (
    // TODO: ideally we should go over these tests and remove these exceptions from occurring
    err.message.includes('S3 service object not initialized') ||
    err.message.includes('Invariant Violation: 19') ||
    err.message.includes('Invariant Violation: 21') ||
    err.message.includes('No collective found with slug') ||
    err.message.includes('Please provide a slug or an id')
  ) {
    return false;
  } else if (
    // Stripe errors
    promise &&
    err.message.includes(`Cannot read properties of undefined (reading 'dispatch')`)
  ) {
    return false;
  } else {
    throw err;
  }
});

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

// Import commands.js using ES2015 syntax:
import './commands';

// See https://github.com/opencollective/opencollective/issues/2676
Cypress.on('uncaught:exception', err => {
  if (err.message.includes('Cannot clear timer: timer created with')) {
    // See https://github.com/cypress-io/cypress/issues/3170
    // Ignore this error
    return false;
  } else {
    throw err;
  }
});

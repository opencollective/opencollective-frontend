// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

import { sharedSentryOptions } from './server/sentry';

Sentry.init({
  ...sharedSentryOptions,
  tracesSampleRate: 0, // Disabling traces sampling for now
});

// Default scope
Sentry.configureScope(scope => {
  scope.setTag('nodejs', process.version);
  scope.setTag('runtimeEngine', 'browser');
});

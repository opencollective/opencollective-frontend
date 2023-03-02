// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN || 'https://2ab0f7da3f56423d940f36370df8d625@o105108.ingest.sentry.io/1736806',
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,

  environment: process.env.OC_ENV,
  attachStacktrace: true,
  release: process.env.SENTRY_RELEASE,
  enabled: process.env.NODE_ENV !== 'test',
  ignoreErrors: [
    /\[Please ignore this error\]/, // See `IgnorableError`
    'Non-Error promise rejection captured with value: Object Not Found Matching Id', // See https://forum.sentry.io/t/unhandledrejection-non-error-promise-rejection-captured-with-value/14062/17
    'Non-Error promise rejection captured with value: null', // See https://forum.sentry.io/t/unhandledrejection-non-error-promise-rejection-captured-with-value/14062/17
    /instantSearchSDKJSBridgeClearHighlight/, // Bug on Edge for IOS, see https://stackoverflow.com/questions/69261499/what-is-instantsearchsdkjsbridgeclearhighlight
    /^No collective found with slug/, // We throw exceptions for these, but they're not really errors
    /Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this/, // Creates a lot of noise in Sentry but it does not seem to have a real impact
    /Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive/,
  ],
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
  ],
});

// Default scope
Sentry.configureScope(scope => {
  scope.setTag('nodejs', process.version);
  scope.setTag('runtimeEngine', typeof window !== 'undefined' ? 'browser' : 'server');
});

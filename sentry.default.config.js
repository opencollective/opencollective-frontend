import * as Sentry from '@sentry/nextjs';

// Default scope
Sentry.configureScope(scope => {
  scope.setTag('nodejs', process.version);
  scope.setTag('runtimeEngine', typeof window !== 'undefined' ? 'browser' : 'server');
});

export default {
  dsn: process.env.SENTRY_DSN,
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

  tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) : 0.01,
};

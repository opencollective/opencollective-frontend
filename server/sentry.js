import * as Sentry from '@sentry/nextjs';

/**
 * Returns the Sentry environment based on env and current server.
 */
const getSentryEnvironment = () => {
  return process.env.OC_ENV;
};

/**
 * Defines options shared by all Sentry integrations (client and server side)
 */
export const sharedSentryOptions = {
  dsn: process.env.SENTRY_DSN,
  environment: getSentryEnvironment(),
  attachStacktrace: true,
  enabled: process.env.NODE_ENV !== 'test',
  org: 'open-collective',
  project: '1736806',
  ignoreErrors: [
    /\[Please ignore this error\]/, // See `IgnorableError`
    'Non-Error promise rejection captured with value: Object Not Found Matching Id', // See https://forum.sentry.io/t/unhandledrejection-non-error-promise-rejection-captured-with-value/14062/17
    'Non-Error promise rejection captured with value: null', // See https://forum.sentry.io/t/unhandledrejection-non-error-promise-rejection-captured-with-value/14062/17
    /instantSearchSDKJSBridgeClearHighlight/, // Bug on Edge for IOS, see https://stackoverflow.com/questions/69261499/what-is-instantsearchsdkjsbridgeclearhighlight
    /^No collective found with slug/, // We throw exceptions for these, but they're not really errors
    /Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this/, // Creates a lot of noise in Sentry but it does not seem to have a real impact
  ],
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
  ],
};

/**
 * Helper to extract Sentry tags from an error
 */
export const captureException = (err, ctx) => {
  Sentry.configureScope(scope => {
    if (err.message) {
      // De-duplication currently doesn't work correctly for SSR / browser errors
      // so we force deduplication by error message if it is present
      scope.setFingerprint([err.message]);
    }

    if (err.statusCode) {
      scope.setExtra('statusCode', err.statusCode);
    }

    if (ctx) {
      const { req, res, errorInfo, query, pathname } = ctx;

      if (res && res.statusCode) {
        scope.setExtra('statusCode', res.statusCode);
      }

      if (typeof window !== 'undefined') {
        scope.setTag('ssr', false);
        scope.setExtra('url', window.location?.href);
        scope.setExtra('query', query);
        scope.setExtra('pathname', pathname);
      } else {
        scope.setTag('ssr', true);
        scope.setExtra('url', req.url);
        scope.setExtra('method', req.method);
        scope.setExtra('headers', req.headers);
        scope.setExtra('params', req.params);
        scope.setExtra('query', req.query);
      }

      if (errorInfo) {
        Object.keys(errorInfo).forEach(key => scope.setExtra(key, errorInfo[key]));
      }
    }
  });

  return Sentry.captureException(err);
};

export { Sentry };

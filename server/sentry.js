// NOTE: This require will be replaced with `@sentry/browser`
// client side thanks to the webpack config in next.config.js
const Sentry = require('@sentry/nextjs');

/**
 * Helper to extract Sentry tags from an error
 */
const captureException = (err, ctx) => {
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

module.exports = { Sentry, captureException };

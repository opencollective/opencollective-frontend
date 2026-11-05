// NOTE: This import will be replaced with `@sentry/browser`
// client side thanks to the webpack config in next.config.js
import type { Scope } from '@sentry/browser';
import * as Sentry from '@sentry/nextjs';

type NextContext = {
  req?: {
    url?: string;
    method?: string;
    headers?: unknown;
    params?: unknown;
    query?: unknown;
  };
  res?: { statusCode?: number };
  errorInfo?: Record<string, unknown>;
  query?: unknown;
  pathname?: string;
};

type ErrorWithStatusCode = Error & { statusCode?: number };

const updateScopeWithNextContext = (scope: Scope, ctx?: NextContext): void => {
  if (ctx) {
    const { req, res, errorInfo, query, pathname } = ctx;

    if (res && res.statusCode) {
      scope.setExtra('statusCode', res.statusCode);
    }

    if (typeof window !== 'undefined') {
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
};

const updateScopeWithWindowContext = (scope: Scope): void => {
  if (typeof window !== 'undefined') {
    scope.setTag('ssr', false);
    scope.setExtra('url', window.location?.href);
  }
};

/**
 * Helper to extract Sentry tags from an error
 */
const captureException = (err: ErrorWithStatusCode, ctx?: NextContext): string | undefined => {
  const scope = Sentry.getCurrentScope();
  if (err.message) {
    // De-duplication currently doesn't work correctly for SSR / browser errors
    // so we force deduplication by error message if it is present
    scope.setFingerprint([err.message]);
  }

  if (err.statusCode) {
    scope.setExtra('statusCode', err.statusCode);
  }

  updateScopeWithWindowContext(scope);
  updateScopeWithNextContext(scope, ctx);

  if (process.env.SENTRY_DSN) {
    return Sentry.captureException(err);
  } else {
    // eslint-disable-next-line no-console
    console.error(`[Sentry disabled] The following error would be reported`, err);
  }
};

const captureMessage = (
  message: string,
  opts?: Parameters<typeof Sentry.captureMessage>[1],
  ctx?: NextContext,
): string | undefined => {
  const scope = Sentry.getCurrentScope();
  updateScopeWithWindowContext(scope);
  updateScopeWithNextContext(scope, ctx);

  if (process.env.SENTRY_DSN) {
    return Sentry.captureMessage(message, opts);
  } else {
    // eslint-disable-next-line no-console
    console.error(`[Sentry disabled] The following message would be reported: ${message}`);
  }
};

const sentryLib = { Sentry, captureException, captureMessage };

export default sentryLib;
export { Sentry, captureMessage };

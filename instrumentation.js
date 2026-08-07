// This file configures the initialization of Sentry on the server and edge runtimes.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

import defaultConfig from './sentry.default.config.js';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      ...defaultConfig,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;

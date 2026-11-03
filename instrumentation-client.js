// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

import { SENTRY_APPLICATION_KEY } from './sentry.constants';
import defaultConfig from './sentry.default.config.js';
import { isExtensionOrInjectedScriptError } from './sentry-filters.js';

const shouldUseThirdPartyErrorFilter = process.env.NODE_ENV === 'production';

Sentry.init({
  ...defaultConfig,
  integrations(defaultIntegrations) {
    const integrations = [...defaultIntegrations];

    if (shouldUseThirdPartyErrorFilter) {
      integrations.push(
        Sentry.thirdPartyErrorFilterIntegration({
          filterKeys: [SENTRY_APPLICATION_KEY],
          behaviour: 'drop-error-if-exclusively-contains-third-party-frames',
        }),
      );
    }

    return integrations;
  },
  beforeSend(event) {
    if (isExtensionOrInjectedScriptError(event)) {
      return null;
    }

    return event;
  },
});

import * as Sentry from '@sentry/nextjs';
import { pick } from 'lodash';
import type { NextPageContext } from 'next';

const supportedLanguages = ['en'];

const languages = require.context('../../lang', false, /\.json$/i, 'weak');
languages.keys().forEach(element => {
  const match = element.match(/\.?\/?([^.]+)\.json$/);
  if (match) {
    supportedLanguages.push(match[1]);
  }
});

type IntlProps = {
  language?: string;
  locale: string;
};

export function getIntlProps(ctx: NextPageContext): IntlProps {
  if (!ctx?.req) {
    return pick(window.__NEXT_DATA__.props, 'language', 'locale');
  }

  const { language, locale } = getRequestIntl(ctx.req);
  return {
    language,
    locale,
  };
}

export function getRequestIntl(req: NextPageContext['req']): IntlProps {
  try {
    let language: string, locale: string;

    const url = new URL(req.url, `http://${req.headers.host}`);
    const queryLanguage = url.searchParams.get('language');

    if (queryLanguage && supportedLanguages.includes(queryLanguage)) {
      language = queryLanguage;
    } else if (typeof window === 'undefined') {
      const cookie = require('cookie');
      const cookies = cookie.parse(req?.headers?.['cookie'] ?? '');
      const cookieLanguage = cookies?.['language'];

      if (cookieLanguage && supportedLanguages.includes(cookieLanguage)) {
        language = cookieLanguage;
      }
    }

    if (['test', 'e2e', 'ci'].includes(process.env.OC_ENV)) {
      locale = language || 'en';
    } else {
      if (typeof window === 'undefined') {
        const accepts = require('accepts');
        locale = language || accepts(req).language(supportedLanguages) || 'en';
      }
    }

    return {
      language,
      locale,
    };
  } catch (e) {
    Sentry.captureException(e);
    return {
      locale: 'en',
    };
  }
}

/** Fetches the i18n messages for the given locale, async */
export function getLocaleMessages(locale: string): Promise<Record<string, string>> {
  // creates a async split chunks of the available languages.
  return import(
    /* webpackInclude: /\.json$/i */
    /* webpackChunkName: "i18n-messages-[request]" */
    /* webpackMode: "lazy" */
    `../../lang/${locale}.json`
  );
}

/** Client only. The message chunk (i18n-messages-${locale}) created from getLocaleMessages is injected as a script by _document,
 * making it available for a sync require during hydration.
 */
export function getPreloadedLocaleMessages(locale: string) {
  if (typeof window === 'undefined') {
    return;
  }
  // checks if the module is loaded using a weak require (does not include the dependency in this bundle)
  const moduleId = require.resolveWeak(`../../lang/${locale}.json`);
  // eslint-disable-next-line no-undef, camelcase
  if (moduleId && __webpack_modules__[moduleId]) {
    // if the module is loaded, require it using the webpack raw require to avoid adding it to this bundle as a dependency.
    // eslint-disable-next-line no-undef
    return __webpack_require__(moduleId);
  }

  return;
}

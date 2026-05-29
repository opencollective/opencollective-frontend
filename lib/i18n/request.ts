import * as Sentry from '@sentry/nextjs';
import { pick } from 'lodash-es';
import type { NextPageContext } from 'next';

import supportedLanguages from './supported-languages';

type IntlProps = {
  language?: string;
  locale: string;
};

type NextDataProps = {
  locale?: string;
  language?: string;
  messages?: Record<string, string>;
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
      const cookie = require('cookie'); // eslint-disable-line @typescript-eslint/no-require-imports
      const cookies = cookie.parse(req.headers['cookie'] ?? '');
      const cookieLanguage = cookies?.['language'];

      if (cookieLanguage && supportedLanguages.includes(cookieLanguage)) {
        language = cookieLanguage;
      }
    }

    if (['test', 'e2e', 'ci'].includes(process.env.OC_ENV)) {
      locale = language || 'en';
    } else {
      if (typeof window === 'undefined') {
        const accepts = require('accepts'); // eslint-disable-line @typescript-eslint/no-require-imports
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
  return import(`../../lang/${locale}.json`);
}

/** Client only. Returns messages serialized in __NEXT_DATA__ during SSR. */
export function getInitialLocaleMessages(locale: string): Record<string, string> | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const nextData = (window as Window & { __NEXT_DATA__?: { props?: NextDataProps } }).__NEXT_DATA__?.props;
  if (nextData?.locale === locale && nextData?.messages) {
    return nextData.messages;
  }

  return undefined;
}

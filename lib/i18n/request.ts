import accepts from 'accepts';
import cookie from 'cookie';
import { pick } from 'lodash';
import { NextPageContext } from 'next';

const supportedLanguages = [];

const languages = require.context('../../lang', false, /\.json$/i);

languages.keys().forEach(element => {
  const match = element.match(/\.?\/?([^.]+)\.json$/);
  if (match) {
    supportedLanguages.push(match[1]);
  }
});

type IntlProps = {
  language?: string;
  locale: string;
  messages: Record<string, string>;
};

export function getIntlProps(ctx: NextPageContext): IntlProps {
  if (!ctx?.req) {
    return pick(window.__NEXT_DATA__.props, 'language', 'locale', 'messages');
  }

  const { language, locale } = getRequestIntl(ctx.req);
  const messages = getLocaleMessages(locale);
  return {
    language,
    locale,
    messages,
  };
}

export function getRequestIntl(req: NextPageContext['req']): Pick<IntlProps, 'language' | 'locale'> {
  let language: string, locale: string;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const queryLanguage = url.searchParams.get('language');

  if (queryLanguage && supportedLanguages.includes(queryLanguage)) {
    language = queryLanguage;
  } else {
    const cookies = cookie.parse(req?.headers?.['cookie'] ?? '');
    const cookieLanguage = cookies?.['language'];

    if (cookieLanguage && supportedLanguages.includes(cookieLanguage)) {
      language = cookieLanguage;
    }
  }

  if (['test', 'e2e', 'ci'].includes(process.env.OC_ENV)) {
    locale = language || 'en';
  } else {
    locale = language || accepts(req).language(supportedLanguages) || 'en';
  }

  return {
    language,
    locale,
  };
}

export function getLocaleMessages(locale: string) {
  return languages(`./${locale}.json`);
}

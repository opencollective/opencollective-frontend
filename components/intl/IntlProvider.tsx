import React from 'react';
import { createIntl, RawIntlProvider } from 'react-intl';

import { getLocaleMessages } from '../../lib/i18n/request';

import { useSSRIntlContext } from './SSRIntlProvider';

export default function IntlProvider({ children, locale }) {
  const [messages, setMessages] = React.useState(
    typeof window !== 'undefined' ? window.__NEXT_DATA__.props.messages : null,
  );
  const ssrContext = useSSRIntlContext();

  React.useEffect(() => {
    async function loadLocaleMessages() {
      setMessages(await getLocaleMessages(locale));
    }
    loadLocaleMessages();
  }, [locale]);

  const clientIntl = React.useMemo(() => createIntl({ locale, defaultLocale: 'en', messages }), [locale, messages]);

  return <RawIntlProvider value={ssrContext?.intl || clientIntl}>{children}</RawIntlProvider>;
}

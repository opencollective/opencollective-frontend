import React from 'react';
import { createIntl, RawIntlProvider } from 'react-intl';

import { getLocaleMessages, getPreloadedLocaleMessages } from '../../lib/i18n/request';

import { useSSRIntlContext } from './SSRIntlProvider';

const LocaleContext = React.createContext<{
  setLocale(l: string);
  locale: string;
}>(null);

export function useLocaleContext() {
  return React.useContext(LocaleContext);
}

export default function IntlProvider({ children, locale }) {
  const [selectedLocale, setSelectedLocale] = React.useState(locale);
  const [messages, setMessages] = React.useState(getPreloadedLocaleMessages(locale));
  // SSR only: contains the messages used during this render
  const ssrContext = useSSRIntlContext();

  // Client only: fetches messages for the rest of the app async
  React.useEffect(() => {
    async function loadLocaleMessages() {
      setMessages(await getLocaleMessages(selectedLocale));
    }
    loadLocaleMessages();
  }, [selectedLocale]);

  const clientIntl = React.useMemo(
    () => createIntl({ locale: selectedLocale, defaultLocale: 'en', messages }),
    [messages, selectedLocale],
  );

  const setLocale = React.useCallback((newLocale: string) => {
    document.cookie = `language=${newLocale};path=/`;
    setSelectedLocale(newLocale);
  }, []);

  return (
    <RawIntlProvider value={ssrContext?.intl || clientIntl}>
      <LocaleContext.Provider
        value={{
          setLocale,
          locale: selectedLocale,
        }}
      >
        {children}
      </LocaleContext.Provider>
    </RawIntlProvider>
  );
}

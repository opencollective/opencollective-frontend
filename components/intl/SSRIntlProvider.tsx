import React from 'react';
import type { IntlShape } from 'react-intl';

const SSRIntlContext = React.createContext<{ intl: IntlShape }>(null);

export function SSRIntlProvider({ children, intl }) {
  return <SSRIntlContext.Provider value={{ intl }}>{children}</SSRIntlContext.Provider>;
}

export function useSSRIntlContext() {
  return React.useContext(SSRIntlContext);
}

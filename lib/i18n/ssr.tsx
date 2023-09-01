import React from 'react';
import { createIntl, createIntlCache, IntlCache, IntlShape } from 'react-intl';

import { SSRIntlProvider } from '../../components/intl/SSRIntlProvider';

const cache = createIntlCache();

export class ServerIntl {
  usedMessages: Record<symbol | string, string>;
  messagesProxy: Record<symbol | string, string>;
  cacheProxy: IntlCache;
  intl: IntlShape;

  constructor(locale, messages) {
    this.usedMessages = {};
    const ssrIntl = this;

    this.messagesProxy = new Proxy(messages, {
      get(target, p, receiver) {
        ssrIntl.usedMessages[p] = messages[p];
        return Reflect.get(target, p, receiver);
      },
    });

    this.intl = createIntl({ locale, defaultLocale: 'en', messages: this.messagesProxy }, cache);
  }

  collectMessages(children) {
    return <SSRIntlProvider intl={this.intl}>{children}</SSRIntlProvider>;
  }

  getMessages(): Record<string, string> {
    return this.usedMessages;
  }
}

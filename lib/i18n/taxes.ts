import { defineMessages, type IntlShape, type MessageDescriptor } from 'react-intl';

const typeMsg: Record<string, MessageDescriptor> = defineMessages({
  VAT: {
    id: 'tax.vat',
    defaultMessage: 'Value-added tax',
  },
  GST: {
    id: 'tax.gst',
    defaultMessage: 'Goods and services tax',
  },
});

const typeMsgShort: Record<string, MessageDescriptor> = defineMessages({
  VAT: {
    id: 'tax.vatShort',
    defaultMessage: 'VAT',
  },
  GST: {
    id: 'tax.gstShort',
    defaultMessage: 'GST',
  },
});

const descriptionMsg: Record<string, MessageDescriptor> = defineMessages({
  VAT: {
    id: 'tax.vat.description',
    defaultMessage: 'This tier type is subject to VAT in Europe.',
  },
  GST: {
    id: 'tax.gst.description',
    defaultMessage: 'This tier type is subject to GST in New Zealand.',
  },
});

export const i18nTaxType = (intl: IntlShape, taxType: string, version = 'full'): string => {
  const msgLong = typeMsg[taxType];
  const msgShort = typeMsgShort[taxType];
  if (!msgLong || !msgShort) {
    return taxType;
  } else if (version === 'full') {
    return `${intl.formatMessage(msgLong)} (${intl.formatMessage(msgShort)})`;
  } else if (version === 'long') {
    return intl.formatMessage(msgLong);
  } else {
    return intl.formatMessage(typeMsgShort[taxType]);
  }
};

export const i18nTaxDescription = (intl: IntlShape, taxType: string): string | null => {
  const msg = descriptionMsg[taxType];
  return msg ? intl.formatMessage(msg) : null;
};

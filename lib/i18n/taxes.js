import { defineMessages } from 'react-intl';

const typeMsg = defineMessages({
  VAT: {
    id: 'tax.vat',
    defaultMessage: 'Value-added tax',
  },
  GST: {
    id: 'tax.gst',
    defaultMessage: 'Goods and services tax',
  },
});

const typeMsgShort = defineMessages({
  VAT: {
    id: 'tax.vatShort',
    defaultMessage: 'VAT',
  },
  GST: {
    id: 'tax.gstShort',
    defaultMessage: 'GST',
  },
});

const descriptionMsg = defineMessages({
  VAT: {
    id: 'tax.vat.description',
    defaultMessage: 'This tier type is subject to VAT in Europe.',
  },
  GST: {
    id: 'tax.gst.description',
    defaultMessage: 'This tier type is subject to GST in New Zealand.',
  },
});

export const i18nTaxType = (intl, taxType, version = 'full') => {
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

export const i18nTaxDescription = (intl, taxType) => {
  return descriptionMsg[taxType] ? intl.formatMessage(descriptionMsg[taxType]) : null;
};

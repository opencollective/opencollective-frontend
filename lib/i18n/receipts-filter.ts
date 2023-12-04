import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
  RECEIPT_MISSING: { defaultMessage: 'Has missing receipts' },
  NO_RECEIPT_MISSING: { defaultMessage: 'Has no receipts missing' },
  HAS_RECEIPTS: { id: 'VirtualCard.WithReceiptsFilter', defaultMessage: 'Has receipts' },
  HAS_NO_RECEIPTS: { id: 'VirtualCard.WithoutReceiptsFilter', defaultMessage: 'Has no receipts' },
});

export const i18nHasMissingReceipts = (intl, value) => {
  const i18nMsg = value ? MESSAGES.RECEIPT_MISSING : MESSAGES.NO_RECEIPT_MISSING;
  return i18nMsg ? intl.formatMessage(i18nMsg) : value;
};

export const i18nChargeHasReceipts = (intl, value) => {
  const i18nMsg = value ? MESSAGES.HAS_RECEIPTS : MESSAGES.HAS_NO_RECEIPTS;
  return i18nMsg ? intl.formatMessage(i18nMsg) : value;
};

import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
  HAS_DEBT: { defaultMessage: 'Has Debt', id: 'ihvDCr' },
  HAS_NO_DEBT: { defaultMessage: 'Has no Debt', id: 'lEabo/' },
});

export const i18nHasDebt = (intl, value) => {
  const i18nMsg = value ? MESSAGES.HAS_DEBT : MESSAGES.HAS_NO_DEBT;
  return i18nMsg ? intl.formatMessage(i18nMsg) : value;
};

import { defineMessages } from 'react-intl';
import { PayoutMethodType } from './constants/payout-method';

const TypesI18n = defineMessages({
  [PayoutMethodType.OTHER]: {
    id: 'PayoutMethod.Type.Other',
    defaultMessage: 'Other',
  },
  [PayoutMethodType.PAYPAL]: {
    id: 'PayoutMethod.Type.Paypal',
    defaultMessage: 'PayPal',
  },
  [PayoutMethodType.BANK_ACCOUNT]: {
    id: 'PayoutMethod.Type.BankAccount',
    defaultMessage: 'Wire transfer',
  },
});

/**
 * Translate a member role
 *
 * @param {object} `intl` - see `injectIntl`
 * @param {string} `type`
 */
const i18nPayoutMethodType = (formatMessage, type) => {
  const i18nMsg = TypesI18n[type];
  return i18nMsg ? formatMessage(i18nMsg) : type;
};

export default i18nPayoutMethodType;

import { defineMessages } from 'react-intl';

import { PayoutMethodType } from '../constants/payout-method';

const TypesI18n = defineMessages({
  ALL: {
    id: 'PayoutMethod.Type.All',
    defaultMessage: 'All methods',
  },
  [PayoutMethodType.OTHER]: {
    id: 'PayoutMethod.Type.Other',
    defaultMessage: 'Other',
  },
  [PayoutMethodType.BANK_ACCOUNT]: {
    id: 'PayoutMethod.Type.BankAccount',
    defaultMessage: 'Bank transfer',
  },
});

/**
 * Translate a member role
 *
 * @param {object} `intl` - see `injectIntl`
 * @param {string} `type`
 */
const i18nPayoutMethodType = (intl, type, { aliasBankAccountToTransferWise } = {}) => {
  if (!type) {
    return intl.formatMessage(TypesI18n[PayoutMethodType.OTHER]);
  } else if (type === PayoutMethodType.PAYPAL) {
    return 'PayPal';
  } else if (type === PayoutMethodType.BANK_ACCOUNT && aliasBankAccountToTransferWise) {
    return 'Wise';
  } else if (type === PayoutMethodType.ACCOUNT_BALANCE) {
    return 'Open Collective';
  }

  const i18nMsg = TypesI18n[type];
  return i18nMsg ? intl.formatMessage(i18nMsg) : type;
};

export default i18nPayoutMethodType;

import { defineMessages } from 'react-intl';

import { HOST_FEE_STRUCTURE } from '../constants/host-fee-structure';

const TypesI18n = defineMessages({
  ALL: {
    id: 'HostFee.AllTypes',
    defaultMessage: 'All',
  },
  [HOST_FEE_STRUCTURE.DEFAULT]: {
    id: 'HostFee.Global',
    defaultMessage: 'Global host fee',
  },
  [HOST_FEE_STRUCTURE.CUSTOM_FEE]: {
    id: 'HostFee.Custom',
    defaultMessage: 'Custom host fee',
  },
  [HOST_FEE_STRUCTURE.MONTHLY_RETAINER]: {
    id: 'HostFee.MonthlyRetainer',
    defaultMessage: 'Monthly retainer',
  },
});

/**
 * Translate a member role
 *
 * @param {object} `intl` - see `injectIntl`
 * @param {string} `type`
 */
export const formatHostFeeStructure = (intl, type) => {
  const i18nMsg = TypesI18n[type];
  return i18nMsg ? intl.formatMessage(i18nMsg) : type;
};

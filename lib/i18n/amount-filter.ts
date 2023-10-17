import { defineMessages } from 'react-intl';

import { AmountFilterType } from '../../components/dashboard/filters/AmountFilter/schema';

const i18nFilterOption = defineMessages({
  [AmountFilterType.IS_EQUAL_TO]: {
    id: 'Filter.isEqualTo',
    defaultMessage: 'is equal to',
  },
  [AmountFilterType.IS_BETWEEN]: {
    id: 'Filter.isBetween',
    defaultMessage: 'is between',
  },
  [AmountFilterType.IS_GREATER_THAN]: {
    id: 'Filter.isGreaterThan',
    defaultMessage: 'is greater than',
  },
  [AmountFilterType.IS_LESS_THAN]: {
    id: 'Filter.isLessThan',
    defaultMessage: 'is less than',
  },
});

export const i18nAmountFilterLabel = (intl, type) => {
  return i18nFilterOption[type] ? intl.formatMessage(i18nFilterOption[type]) : type;
};

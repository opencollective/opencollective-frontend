import { defineMessages } from 'react-intl';

import INTERVALS from '../constants/intervals';

const msg = defineMessages({
  [INTERVALS.oneTime]: {
    id: 'Frequency.OneTime',
    defaultMessage: 'One time',
  },
  [INTERVALS.month]: {
    id: 'Frequency.Monthly',
    defaultMessage: 'Monthly',
  },
  [INTERVALS.year]: {
    id: 'Frequency.Yearly',
    defaultMessage: 'Yearly',
  },
});

/**
 * Translate an interval (monthly, yearly, etc).
 */
export const i18nInterval = (intl, interval) => {
  const i18nMsg = msg[interval];
  return i18nMsg ? intl.formatMessage(i18nMsg) : interval;
};

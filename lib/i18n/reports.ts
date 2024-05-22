import { defineMessages } from 'react-intl';

import { ReportSection } from '../../components/dashboard/sections/reports/preview/types';

const MESSAGES = defineMessages({
  [ReportSection.CONTRIBUTIONS]: {
    id: 'Contributions',
    defaultMessage: 'Contributions',
  },
  [ReportSection.EXPENSES]: {
    id: 'Expenses',
    defaultMessage: 'Expenses',
  },
  [ReportSection.FEES_TIPS]: {
    defaultMessage: 'Fees & Tips',
    id: 'P3537s',
  },
  [ReportSection.OTHER]: {
    defaultMessage: 'Other',
    id: '/VnDMl',
  },
});

export const i18nReportSection = (intl, value) => {
  const i18nMsg = MESSAGES[value];
  return i18nMsg ? intl.formatMessage(i18nMsg) : value;
};

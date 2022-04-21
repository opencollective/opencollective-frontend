import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
  ACTIVITY: {
    defaultMessage: 'Activity',
  },
  'CREATED_AT.ASC': {
    defaultMessage: 'Oldest created',
  },
  'CREATED_AT.DESC': {
    defaultMessage: 'Recently created',
  },
});

const i18nSearchSortingOptions = (intl, sortOption) => {
  const i18nMsg = MESSAGES[sortOption];
  return i18nMsg ? intl.formatMessage(i18nMsg) : sortOption;
};

export default i18nSearchSortingOptions;

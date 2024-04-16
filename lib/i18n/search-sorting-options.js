import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
  ACTIVITY: {
    defaultMessage: 'Activity',
    id: 'ZmlNQ3',
  },
  RANK: {
    defaultMessage: 'Relevancy',
    id: 'XNgXMJ',
  },
  'CREATED_AT.ASC': {
    defaultMessage: 'Oldest created',
    id: 'd8OVmo',
  },
  'CREATED_AT.DESC': {
    defaultMessage: 'Recently created',
    id: 'RC6rA2',
  },
});

const i18nSearchSortingOptions = (intl, sortOption) => {
  const i18nMsg = MESSAGES[sortOption];
  return i18nMsg ? intl.formatMessage(i18nMsg) : sortOption;
};

export default i18nSearchSortingOptions;

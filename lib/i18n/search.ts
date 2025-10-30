import { defineMessages } from 'react-intl';

import { SearchEntity } from '@/components/search/schema';

const i18nEntity = defineMessages({
  [SearchEntity.ALL]: {
    id: 'All',
    defaultMessage: 'All',
  },
  [SearchEntity.ACCOUNTS]: {
    defaultMessage: 'Accounts',
    id: 'FvanT6',
  },
  [SearchEntity.EXPENSES]: {
    defaultMessage: 'Expenses',
    id: 'k2VBcF',
  },
  [SearchEntity.CONTRIBUTIONS]: {
    defaultMessage: 'Contributions',
    id: 'oVDe1D',
  },
  [SearchEntity.TRANSACTIONS]: {
    defaultMessage: 'Transactions',
    id: '/jJLYy',
  },
  [SearchEntity.UPDATES]: {
    defaultMessage: 'Updates',
    id: 'recCg9',
  },
  [SearchEntity.COMMENTS]: {
    defaultMessage: 'Comments',
    id: 'wCgTu5',
  },
});

export const i18nSearchEntity = (intl, entity) => {
  return i18nEntity[entity] ? intl.formatMessage(i18nEntity[entity]) : entity;
};

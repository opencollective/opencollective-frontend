import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

import { SearchEntity } from '@/components/search/filters';

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
    id: 'Expenses',
  },
  [SearchEntity.ORDERS]: {
    defaultMessage: 'Contributions',
    id: 'Contributions',
  },
  [SearchEntity.TRANSACTIONS]: {
    defaultMessage: 'Transactions',
    id: 'menu.transactions',
  },
  [SearchEntity.UPDATES]: {
    defaultMessage: 'Updates',
    id: 'updates',
  },
  [SearchEntity.COMMENTS]: {
    defaultMessage: 'Comments',
    id: 'wCgTu5',
  },
  [SearchEntity.HOST_APPLICATIONS]: {
    defaultMessage: 'Host Applications',
    id: 'Menu.HostApplications',
  },
  [SearchEntity.DASHBOARD_TOOL]: {
    defaultMessage: 'Dashboard',
    id: 'Dashboard',
  },
});

export const i18nSearchEntity = (intl, entity) => {
  return i18nEntity[entity] ? intl.formatMessage(i18nEntity[entity]) : entity;
};

/**
 * Formats a search total. A capped total (`totalCountIsCapped`) is a lower bound: there are more matches (e.g. "10,000+").
 */
export const i18nSearchCount = (intl: IntlShape, count: number, isCapped?: boolean): string => {
  const formattedCount = intl.formatNumber(count);
  return isCapped
    ? intl.formatMessage({ id: 'search.cappedCount', defaultMessage: '{count}+' }, { count: formattedCount })
    : formattedCount;
};

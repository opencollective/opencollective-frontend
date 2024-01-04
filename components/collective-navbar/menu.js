import { defineMessages } from 'react-intl';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { isIndividualAccount } from '../../lib/collective';
import { hasSection } from '../../lib/collective-sections';
import i18nCollectivePageSection from '../../lib/i18n-collective-page-section';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import { Sections } from '../collective-page/_constants';

import { NAVBAR_CATEGORIES } from './constants';

export const NAVBAR_ACTION_TYPE = {
  SUBMIT_EXPENSE: 'hasSubmitExpense',
  DASHBOARD: 'hasDashboard',
  APPLY: 'hasApply',
  CONTACT: 'hasContact',
  ADD_FUNDS: 'addFunds',
  ASSIGN_CARD: 'assignCard',
  REQUEST_CARD: 'requestCard',
  CONTRIBUTE: 'hasContribute',
  MANAGE_SUBSCRIPTIONS: 'hasManageSubscriptions',
  REQUEST_GRANT: 'hasRequestGrant',
  SETTINGS: 'hasSettings',
};

const titles = defineMessages({
  CONTRIBUTE: {
    id: 'SectionContribute.All',
    defaultMessage: 'All ways to contribute',
  },
  TRANSACTIONS: {
    id: 'menu.transactions',
    defaultMessage: 'Transactions',
  },
  EXPENSES: {
    id: 'Expenses',
    defaultMessage: 'Expenses',
  },
  SUBMITTED_EXPENSES: {
    defaultMessage: 'Submitted Expenses',
  },
  UPDATES: {
    id: 'updates',
    defaultMessage: 'Updates',
  },
  EVENTS: {
    id: 'Events',
    defaultMessage: 'Events',
  },
  PROJECTS: {
    id: 'Projects',
    defaultMessage: 'Projects',
  },
  CONNECTED_COLLECTIVES: {
    id: 'ConnectedCollectives',
    defaultMessage: 'Connected Collectives',
  },
  CONVERSATIONS: {
    id: 'conversations',
    defaultMessage: 'Conversations',
  },
});

const addSectionLink = (intl, links, collective, sections, section) => {
  if (hasSection(sections, section)) {
    links.push({
      route: `/${collective.slug}#section-${section}`,
      title: i18nCollectivePageSection(intl, section),
      hide: true, // Section links are not displayed yet
    });
  }
};

/**
 * Builds all menu entries, based on categories & enabled features
 */
const getCategoryMenuLinks = (intl, collective, sections, category) => {
  const links = [];
  const collectivePageRoute = getCollectivePageRoute(collective);

  if (category === NAVBAR_CATEGORIES.ABOUT) {
    // About
    addSectionLink(intl, links, collective, sections, Sections.ABOUT);
    addSectionLink(intl, links, collective, sections, Sections.OUR_TEAM);
    addSectionLink(intl, links, collective, sections, Sections.GOALS);
  } else if (category === NAVBAR_CATEGORIES.CONTRIBUTE) {
    // Contribute
    if (hasFeature(collective, FEATURES.RECEIVE_FINANCIAL_CONTRIBUTIONS) && hasSection(sections, Sections.CONTRIBUTE)) {
      links.push({
        route: `${collectivePageRoute}/contribute`,
        title: intl.formatMessage(titles.CONTRIBUTE),
      });
    }

    if (hasFeature(collective, FEATURES.EVENTS) && hasSection(sections, Sections.EVENTS)) {
      links.push({
        route: `${collectivePageRoute}/events`,
        title: intl.formatMessage(titles.EVENTS),
      });
    }

    if (hasFeature(collective, FEATURES.PROJECTS) && hasSection(sections, Sections.PROJECTS)) {
      links.push({
        route: `${collectivePageRoute}/projects`,
        title: intl.formatMessage(titles.PROJECTS),
      });
    }

    if (hasFeature(collective, FEATURES.CONNECTED_ACCOUNTS) && hasSection(sections, Sections.CONNECTED_COLLECTIVES)) {
      links.push({
        route: `${collectivePageRoute}/connected-collectives`,
        title: intl.formatMessage(titles.CONNECTED_COLLECTIVES),
      });
    }

    if (hasSection(sections, Sections.CONTRIBUTORS)) {
      addSectionLink(intl, links, collective, sections, Sections.CONTRIBUTORS);
    }
  } else if (category === NAVBAR_CATEGORIES.CONTRIBUTIONS) {
    addSectionLink(intl, links, collective, sections, Sections.CONTRIBUTIONS);
  } else if (category === NAVBAR_CATEGORIES.BUDGET) {
    // Budget
    links.push({
      route: `${collectivePageRoute}/transactions`,
      title: intl.formatMessage(titles.TRANSACTIONS),
    });

    if (isIndividualAccount(collective) && !collective.isHost) {
      links.push({
        route: `${collectivePageRoute}/submitted-expenses`,
        title: intl.formatMessage(titles.SUBMITTED_EXPENSES),
      });
    } else {
      links.push({
        route: `${collectivePageRoute}/expenses`,
        title: intl.formatMessage(titles.EXPENSES),
      });
    }
  } else if (category === NAVBAR_CATEGORIES.CONNECT) {
    // Connect
    if (hasFeature(collective, FEATURES.UPDATES) && hasSection(sections, Sections.UPDATES)) {
      links.push({
        route: `${collectivePageRoute}/updates`,
        title: intl.formatMessage(titles.UPDATES),
      });
    }
    if (hasFeature(collective, FEATURES.CONVERSATIONS) && hasSection(sections, Sections.CONVERSATIONS)) {
      links.push({
        route: `${collectivePageRoute}/conversations`,
        title: intl.formatMessage(titles.CONVERSATIONS),
      });
    }
  }

  return links;
};

export const getNavBarMenu = (intl, collective, sections) => {
  const menu = [];
  sections.forEach(({ type, name }) => {
    if (type === 'CATEGORY') {
      const links = getCategoryMenuLinks(intl, collective, sections, name);
      if (links.length) {
        menu.push({ category: name, links });
      }
    }
  });

  return menu;
};

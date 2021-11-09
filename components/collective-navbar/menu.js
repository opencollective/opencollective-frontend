import { defineMessages } from 'react-intl';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { hasSection, NAVBAR_CATEGORIES } from '../../lib/collective-sections';
import i18nCollectivePageSection from '../../lib/i18n-collective-page-section';

import { Sections } from '../collective-page/_constants';

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
  UPDATES: {
    id: 'updates',
    defaultMessage: 'Updates',
  },
  EVENTS: {
    id: 'Events',
    defaultMessage: 'Events',
  },
  PROJECTS: {
    id: 'CollectivePage.SectionProjects.Title',
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
  const collectiveSlug = collective.slug;

  if (category === NAVBAR_CATEGORIES.ABOUT) {
    // About
    addSectionLink(intl, links, collective, sections, Sections.ABOUT);
    addSectionLink(intl, links, collective, sections, Sections.OUR_TEAM);
    addSectionLink(intl, links, collective, sections, Sections.GOALS);
  } else if (category === NAVBAR_CATEGORIES.CONTRIBUTE) {
    // Contribute
    if (hasFeature(collective, FEATURES.RECEIVE_FINANCIAL_CONTRIBUTIONS) && hasSection(sections, Sections.CONTRIBUTE)) {
      links.push({
        route: `/${collectiveSlug}/contribute`,
        title: intl.formatMessage(titles.CONTRIBUTE),
      });
    }

    if (hasFeature(collective, FEATURES.EVENTS) && hasSection(sections, Sections.EVENTS)) {
      links.push({
        route: `/${collectiveSlug}/events`,
        title: intl.formatMessage(titles.EVENTS),
      });
    }

    if (hasFeature(collective, FEATURES.PROJECTS) && hasSection(sections, Sections.PROJECTS)) {
      links.push({
        route: `/${collectiveSlug}/projects`,
        title: intl.formatMessage(titles.PROJECTS),
      });
    }

    if (hasFeature(collective, FEATURES.CONNECTED_ACCOUNTS) && hasSection(sections, Sections.CONNECTED_COLLECTIVES)) {
      links.push({
        route: `/${collectiveSlug}/connected-collectives`,
        title: intl.formatMessage(titles.CONNECTED_COLLECTIVES),
      });
    }
  } else if (category === NAVBAR_CATEGORIES.CONTRIBUTIONS) {
    addSectionLink(intl, links, collective, sections, Sections.CONTRIBUTIONS);
  } else if (category === NAVBAR_CATEGORIES.BUDGET) {
    // Budget
    links.push({
      route: `/${collectiveSlug}/transactions`,
      title: intl.formatMessage(titles.TRANSACTIONS),
    });

    if (hasFeature(collective, FEATURES.RECEIVE_EXPENSES)) {
      links.push({
        route: `/${collectiveSlug}/expenses`,
        title: intl.formatMessage(titles.EXPENSES),
      });
    }
  } else if (category === NAVBAR_CATEGORIES.CONNECT) {
    // Connect
    if (hasFeature(collective, FEATURES.UPDATES) && hasSection(sections, Sections.UPDATES)) {
      links.push({
        route: `/${collectiveSlug}/updates`,
        title: intl.formatMessage(titles.UPDATES),
      });
    }
    if (hasFeature(collective, FEATURES.CONVERSATIONS) && hasSection(sections, Sections.CONVERSATIONS)) {
      links.push({
        route: `/${collectiveSlug}/conversations`,
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

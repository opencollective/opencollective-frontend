import { defineMessages, type IntlShape, type MessageDescriptor } from 'react-intl';

import { Sections } from '../components/collective-page/_constants';

const I18N_SECTIONS: Record<string, MessageDescriptor> = defineMessages({
  [Sections.TOP_FINANCIAL_CONTRIBUTORS]: {
    id: 'SectionContribute.TopContributors',
    defaultMessage: 'Top financial contributors',
  },
  [Sections.CONNECTED_COLLECTIVES]: {
    id: 'ConnectedCollectives',
    defaultMessage: 'Connected Collectives',
  },
  [Sections.OUR_TEAM]: {
    id: 'OurTeam',
    defaultMessage: 'Our team',
  },
  [Sections.GOALS]: {
    id: 'Goals',
    defaultMessage: 'Goals',
  },
  [Sections.UPDATES]: {
    id: 'updates',
    defaultMessage: 'Updates',
  },
  [Sections.CONVERSATIONS]: {
    id: 'conversations',
    defaultMessage: 'Conversations',
  },
  [Sections.TICKETS]: {
    id: 'section.tickets.title',
    defaultMessage: 'Tickets',
  },
  [Sections.LOCATION]: {
    id: 'SectionLocation.Title',
    defaultMessage: 'Location',
  },
  // CONTRIBUTE/CONTRIBUTIONS
  [Sections.CONTRIBUTE]: {
    id: 'Contribute',
    defaultMessage: 'Contribute',
  },
  [Sections.CONTRIBUTIONS]: {
    id: 'Contributions',
    defaultMessage: 'Contributions',
  },
  // EVENTS/PROJECTS
  [Sections.EVENTS]: {
    id: 'Events',
    defaultMessage: 'Events',
  },
  [Sections.PROJECTS]: {
    id: 'Projects',
    defaultMessage: 'Projects',
  },
  // BUDGET/TRANSACTIONS
  [Sections.TRANSACTIONS]: {
    id: 'menu.transactions',
    defaultMessage: 'Transactions',
  },
  [Sections.BUDGET]: {
    id: 'section.budget.title',
    defaultMessage: 'Budget',
  },
  // These two sections are no longer part of the collective page navbar: keep their labels keyed by
  // their legacy section names so the translations stay reachable.
  ['financial-overview']: {
    id: 'section.financialOverview.title',
    defaultMessage: 'Financial Overview',
  },
  ['expenses']: {
    id: 'Expenses',
    defaultMessage: 'Expenses',
  },
  // CONTRIBUTORS/PARTICIPANTS
  [Sections.CONTRIBUTORS]: {
    id: 'Contributors',
    defaultMessage: 'Contributors',
  },
  [Sections.PARTICIPANTS]: {
    id: 'CollectivePage.NavBar.Participants',
    defaultMessage: 'Participants',
  },
  // ABOUT
  [Sections.ABOUT]: {
    id: 'collective.about.title',
    defaultMessage: 'About',
  },
});

const i18nCollectivePageSection = (intl: IntlShape, section: string): string => {
  return I18N_SECTIONS[section] ? intl.formatMessage(I18N_SECTIONS[section]) : section;
};

export default i18nCollectivePageSection;

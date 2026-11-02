import { defineMessages, type IntlShape, type MessageDescriptor } from 'react-intl';

import { Sections } from '../components/collective-page/_constants';

// TODO: `Sections.FINANCIAL_OVERVIEW` and `Sections.EXPENSES` are not defined in
// `components/collective-page/_constants`: both lookups resolve to `undefined` at runtime, so the
// second message overrides the first under the `undefined` key. Preserved until fixed in a
// separate commit.
const sections: Record<string, string> = Sections;

const I18N_SECTIONS: Record<string, MessageDescriptor> = defineMessages({
  [sections.TOP_FINANCIAL_CONTRIBUTORS]: {
    id: 'SectionContribute.TopContributors',
    defaultMessage: 'Top financial contributors',
  },
  [sections.CONNECTED_COLLECTIVES]: {
    id: 'ConnectedCollectives',
    defaultMessage: 'Connected Collectives',
  },
  [sections.OUR_TEAM]: {
    id: 'OurTeam',
    defaultMessage: 'Our team',
  },
  [sections.GOALS]: {
    id: 'Goals',
    defaultMessage: 'Goals',
  },
  [sections.UPDATES]: {
    id: 'updates',
    defaultMessage: 'Updates',
  },
  [sections.CONVERSATIONS]: {
    id: 'conversations',
    defaultMessage: 'Conversations',
  },
  [sections.TICKETS]: {
    id: 'section.tickets.title',
    defaultMessage: 'Tickets',
  },
  [sections.LOCATION]: {
    id: 'SectionLocation.Title',
    defaultMessage: 'Location',
  },
  // CONTRIBUTE/CONTRIBUTIONS
  [sections.CONTRIBUTE]: {
    id: 'Contribute',
    defaultMessage: 'Contribute',
  },
  [sections.CONTRIBUTIONS]: {
    id: 'Contributions',
    defaultMessage: 'Contributions',
  },
  // EVENTS/PROJECTS
  [sections.EVENTS]: {
    id: 'Events',
    defaultMessage: 'Events',
  },
  [sections.PROJECTS]: {
    id: 'Projects',
    defaultMessage: 'Projects',
  },
  // BUDGET/TRANSACTIONS
  [sections.TRANSACTIONS]: {
    id: 'menu.transactions',
    defaultMessage: 'Transactions',
  },
  [sections.BUDGET]: {
    id: 'section.budget.title',
    defaultMessage: 'Budget',
  },
  [sections.FINANCIAL_OVERVIEW]: {
    id: 'section.financialOverview.title',
    defaultMessage: 'Financial Overview',
  },
  [sections.EXPENSES]: {
    id: 'Expenses',
    defaultMessage: 'Expenses',
  },
  // CONTRIBUTORS/PARTICIPANTS
  [sections.CONTRIBUTORS]: {
    id: 'Contributors',
    defaultMessage: 'Contributors',
  },
  [sections.PARTICIPANTS]: {
    id: 'CollectivePage.NavBar.Participants',
    defaultMessage: 'Participants',
  },
  // ABOUT
  [sections.ABOUT]: {
    id: 'collective.about.title',
    defaultMessage: 'About',
  },
});

const i18nCollectivePageSection = (intl: IntlShape, section: string): string => {
  return I18N_SECTIONS[section] ? intl.formatMessage(I18N_SECTIONS[section]) : section;
};

export default i18nCollectivePageSection;

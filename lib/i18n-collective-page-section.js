import { defineMessages } from 'react-intl';

import { Sections } from '../components/collective-page/_constants';

const I18N_SECTIONS = defineMessages({
  [Sections.CONTRIBUTE]: {
    id: 'Contribute',
    defaultMessage: 'Contribute',
  },
  [Sections.CONVERSATIONS]: {
    id: 'conversations',
    defaultMessage: 'Conversations',
  },
  [Sections.BUDGET]: {
    id: 'section.budget.title',
    defaultMessage: 'Budget',
  },
  [Sections.CONTRIBUTORS]: {
    id: 'section.contributors.title',
    defaultMessage: 'Contributors',
  },
  [Sections.ABOUT]: {
    id: 'collective.about.title',
    defaultMessage: 'About',
  },
  [Sections.UPDATES]: {
    id: 'updates',
    defaultMessage: 'Updates',
  },
  [Sections.CONTRIBUTIONS]: {
    id: 'Contributions',
    defaultMessage: 'Contributions',
  },
  [Sections.TRANSACTIONS]: {
    id: 'SectionTransactions.Title',
    defaultMessage: 'Transactions',
  },
  [Sections.GOALS]: {
    id: 'Goals',
    defaultMessage: 'Goals',
  },
  [Sections.TICKETS]: {
    id: 'section.tickets.title',
    defaultMessage: 'Tickets',
  },
  [Sections.LOCATION]: {
    id: 'SectionLocation.Title',
    defaultMessage: 'Location',
  },
  [Sections.PARTICIPANTS]: {
    id: 'CollectivePage.NavBar.Participants',
    defaultMessage: 'Participants',
  },
  [Sections.RECURRING_CONTRIBUTIONS]: {
    id: 'CollectivePage.SectionRecurringContributions.Title',
    defaultMessage: 'Recurring Contributions',
  },
  [Sections.PROJECTS]: {
    id: 'CollectivePage.SectionProjects.Title',
    defaultMessage: 'Projects',
  },
  [Sections.CONNECT]: {
    id: 'CollectivePage.SectionConnect.Title',
    defaultMessage: 'Connect',
  },
  [Sections.EVENTS]: {
    id: 'Events',
    defaultMessage: 'Events',
  },
});

const i18nCollectivePageSection = (intl, section) => {
  return I18N_SECTIONS[section] ? intl.formatMessage(I18N_SECTIONS[section]) : section;
};

export default i18nCollectivePageSection;

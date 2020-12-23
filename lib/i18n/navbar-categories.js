import { defineMessages } from 'react-intl';

import { NAVBAR_CATEGORIES } from '../collective-sections';

const I18N_CATEGORIES = defineMessages({
  [NAVBAR_CATEGORIES.ABOUT]: {
    id: 'collective.about.title',
    defaultMessage: 'About',
  },
  [NAVBAR_CATEGORIES.BUDGET]: {
    id: 'section.budget.title',
    defaultMessage: 'Budget',
  },
  [NAVBAR_CATEGORIES.CONNECT]: {
    id: 'CollectivePage.SectionConnect.Title',
    defaultMessage: 'Connect',
  },
  [NAVBAR_CATEGORIES.CONTRIBUTE]: {
    id: 'Contribute',
    defaultMessage: 'Contribute',
  },
  [NAVBAR_CATEGORIES.CONTRIBUTIONS]: {
    id: 'Contributions',
    defaultMessage: 'Contributions',
  },
  [NAVBAR_CATEGORIES.EVENTS]: {
    id: 'EventsAndProjects',
    defaultMessage: 'Events and projects',
  },
  _events: {
    id: 'Events',
    defaultMessage: 'Events',
  },
  _projects: {
    id: 'CollectivePage.SectionProjects.Title',
    defaultMessage: 'Projects',
  },
});

const i18nNavbarCategory = (intl, category, params = {}) => {
  if (category === NAVBAR_CATEGORIES.EVENTS) {
    if (params.hasEvents && !params.hasProjects) {
      return intl.formatMessage(I18N_CATEGORIES['_events']);
    } else if (!params.hasEvents && params.hasProjects) {
      return intl.formatMessage(I18N_CATEGORIES['_projects']);
    }
  }

  return I18N_CATEGORIES[category] ? intl.formatMessage(I18N_CATEGORIES[category]) : category;
};

export default i18nNavbarCategory;

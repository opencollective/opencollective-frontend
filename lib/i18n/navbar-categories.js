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
});

const i18nNavbarCategory = (intl, category) => {
  return I18N_CATEGORIES[category] ? intl.formatMessage(I18N_CATEGORIES[category]) : category;
};

export default i18nNavbarCategory;

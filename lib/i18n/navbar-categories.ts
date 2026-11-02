import { defineMessages, type IntlShape, type MessageDescriptor } from 'react-intl';

import { NAVBAR_CATEGORIES } from '../../components/collective-navbar/constants';

const I18N_CATEGORIES: Record<string, MessageDescriptor> = defineMessages({
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
});

const i18nNavbarCategory = (intl: IntlShape, category: string): string => {
  return I18N_CATEGORIES[category] ? intl.formatMessage(I18N_CATEGORIES[category]) : category;
};

export default i18nNavbarCategory;

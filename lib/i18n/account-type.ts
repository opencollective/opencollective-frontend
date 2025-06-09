import { defineMessages } from 'react-intl';

import { CollectiveType } from '../constants/collectives';

const TypesI18n = defineMessages({
  [CollectiveType.ORGANIZATION]: {
    id: 'AccountType.MainAccount',
    defaultMessage: 'Main account',
  },
  [CollectiveType.COLLECTIVE]: {
    id: 'AccountType.MainAccount',
    defaultMessage: 'Main account',
  },
  [CollectiveType.FUND]: {
    id: 'AccountType.MainAccount',
    defaultMessage: 'Main account',
  },
  [CollectiveType.EVENT]: {
    id: 'ContributionType.Event',
    defaultMessage: 'Event',
  },
  [CollectiveType.PROJECT]: {
    id: 'ContributionType.Project',
    defaultMessage: 'Project',
  },
});

/**
 * Translate a collective type into an "Account type", used in the context of a specific
 * Collective/Organization to explain the accounts (including the main account) that
 * make up the whole Collective/Organization
 *
 * @param {object} `intl` - see `injectIntl`
 * @param {string} `type`
 */
const formatAccountType = (intl, type): string => {
  const i18nMsg = TypesI18n[type];
  return i18nMsg ? intl.formatMessage(i18nMsg) : type;
};

export default formatAccountType;

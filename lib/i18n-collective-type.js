import { defineMessages } from 'react-intl';

import { CollectiveType } from './constants/collectives';

const TypesI18n = defineMessages({
  [CollectiveType.ORGANIZATION]: {
    id: 'CollectiveType.Organization',
    defaultMessage: '{count, plural, one {Organization} other {Organizations}}',
  },
  [CollectiveType.USER]: {
    id: 'CollectiveType.User',
    defaultMessage: '{count, plural, one {User} other {Users}}',
  },
  [CollectiveType.COLLECTIVE]: {
    id: 'CollectiveType.Collective',
    defaultMessage: '{count, plural, one {Collective} other {Collectives}}',
  },
  [CollectiveType.EVENT]: {
    id: 'CollectiveType.Event',
    defaultMessage: '{count, plural, one {Event} other {Events}}',
  },
});

/**
 * Translate a member role
 *
 * @param {object} `intl` - see `injectIntl`
 * @param {string} `type`
 */
const formatCollectiveType = (formatMessage, type, count = 1) => {
  const i18nMsg = TypesI18n[type];
  return i18nMsg ? formatMessage(i18nMsg, { count }) : type;
};

export default formatCollectiveType;

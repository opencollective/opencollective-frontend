import { defineMessages } from 'react-intl';

import roles from '../constants/roles';

const RolesTranslations = defineMessages({
  [roles.HOST]: {
    id: 'Member.Role.HOST',
    defaultMessage: 'Host',
  },
  [roles.ADMIN]: {
    id: 'Member.Role.ADMIN',
    defaultMessage: 'Admin',
  },
  [roles.MEMBER]: {
    id: 'Member.Role.MEMBER',
    defaultMessage: 'Core Contributor',
  },
  [roles.CONTRIBUTOR]: {
    id: 'Contributor',
    defaultMessage: 'Contributor',
  },
  [roles.BACKER]: {
    id: 'Member.Role.BACKER',
    defaultMessage: 'Financial Contributor',
  },
  [roles.ATTENDEE]: {
    id: 'Member.Role.ATTENDEE',
    defaultMessage: 'Attendee',
  },
  [roles.FOLLOWER]: {
    id: 'Member.Role.FOLLOWER',
    defaultMessage: 'Follower',
  },
  [roles.ACCOUNTANT]: {
    id: 'Member.Role.ACCOUNTANT',
    defaultMessage: 'Accountant',
  },
  [roles.CONNECTED_COLLECTIVE]: {
    id: 'Member.Role.ConnectedAccount',
    defaultMessage: 'Connected',
  },
  [roles.CONNECTED_ACCOUNT]: {
    id: 'Member.Role.ConnectedAccount',
    defaultMessage: 'Connected',
  },
});

/**
 * Translate a member role
 *
 * @param {func} `formatMessage` - see `injectIntl` or `useIntl`
 * @param {string} `role` - see `roles`
 */
const formatMemberRole = (intl, role) => {
  const i18nMsg = RolesTranslations[role];
  return i18nMsg ? intl.formatMessage(i18nMsg) : role;
};

export default formatMemberRole;

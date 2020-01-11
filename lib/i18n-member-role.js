import { defineMessages } from 'react-intl';
import roles from '../lib/constants/roles';

const RolesTranslations = defineMessages({
  [roles.HOST]: {
    id: 'Member.Role.HOST',
    defaultMessage: 'Host',
  },
  [roles.ADMIN]: {
    id: 'Member.Role.ADMIN',
    defaultMessage: 'Collective Admin',
  },
  [roles.MEMBER]: {
    id: 'Member.Role.MEMBER',
    defaultMessage: 'Core Contributor',
  },
  [roles.CONTRIBUTOR]: {
    id: 'Member.Role.CONTRIBUTOR',
    defaultMessage: 'Contributor',
  },
  [roles.BACKER]: {
    id: 'Member.Role.BACKER',
    defaultMessage: 'Financial Contributor',
  },
  [roles.FUNDRAISER]: {
    id: 'Member.Role.FUNDRAISER',
    defaultMessage: 'Fundraiser',
  },
  [roles.ATTENDEE]: {
    id: 'Member.Role.ATTENDEE',
    defaultMessage: 'Attendee',
  },
  [roles.FOLLOWER]: {
    id: 'Member.Role.FOLLOWER',
    defaultMessage: 'Follower',
  },
});

/**
 * Translate a member role
 *
 * @param {func} `formatMessage` - see `injectIntl` or `useIntl`
 * @param {string} `role` - see `roles`
 */
const formatMemberRole = (formatMessage, role) => {
  const i18nMsg = RolesTranslations[role];
  return i18nMsg ? formatMessage(i18nMsg) : role;
};

export default formatMemberRole;

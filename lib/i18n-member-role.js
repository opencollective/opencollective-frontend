import { defineMessages } from 'react-intl';
import roles from '../lib/constants/roles';

const RolesTranslations = defineMessages({
  [roles.HOST]: {
    id: 'Member.Role.HOST',
    defaultMessage: 'Host',
  },
  [roles.ADMIN]: {
    id: 'Member.Role.ADMIN',
    defaultMessage: 'Core contributor',
  },
  [roles.MEMBER]: {
    id: 'Member.Role.MEMBER',
    defaultMessage: 'Member',
  },
  [roles.CONTRIBUTOR]: {
    id: 'Member.Role.CONTRIBUTOR',
    defaultMessage: 'Contributor',
  },
  [roles.BACKER]: {
    id: 'Member.Role.BACKER',
    defaultMessage: 'Financial contributor',
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
 * @param {object} `intl` - see `injectIntl`
 * @param {string} `role` - see `roles`
 */
const formatMemberRole = (intl, role) => {
  return intl.formatMessage(RolesTranslations[role]);
};

export default formatMemberRole;

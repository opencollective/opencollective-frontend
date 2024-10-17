import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import roles from '../lib/constants/roles';

import I18nFormatters from './I18nFormatters';

const ROLES_DETAILS = defineMessages({
  [roles.ADMIN]: {
    defaultMessage:
      '<strong>Admins</strong> can edit settings, approve expenses, and receive activity notifications (such as when a new expense is submitted). They are the active managers of a Collective.',
    id: '+Qi39W',
  },
  [roles.MEMBER]: {
    defaultMessage:
      '<strong>Core Contributors</strong> are shown as part of the team on your page but do not have admin access or get notifications. They do not play an active role on the platform.',
    id: 'O8duLC',
  },
  [roles.ACCOUNTANT]: {
    defaultMessage:
      '<strong>Accountants</strong> have read-only access to non-public data, uploaded files, and reports for record-keeping purposes. They cannot make changes and are not shown on your page.',
    id: 'OdjT4O',
  },
});

export const hasRoleDescription = role => {
  return Boolean(ROLES_DETAILS[role]);
};

const MemberRoleDescription = ({ role }) => {
  const intl = useIntl();
  return hasRoleDescription(role) ? intl.formatMessage(ROLES_DETAILS[role], I18nFormatters) : null;
};

MemberRoleDescription.propTypes = {
  role: PropTypes.oneOf(Object.values(roles)),
};

export default MemberRoleDescription;

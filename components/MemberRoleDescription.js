import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import roles from '../lib/constants/roles';

const ROLES_DETAILS = defineMessages({
  [roles.ADMIN]: {
    id: 'RoleDetails.ADMIN',
    defaultMessage:
      'Admins have full permissions to change settings, approve expenses, and make financial contributions from the budget balance.',
  },
  [roles.MEMBER]: {
    id: 'RoleDetails.MEMBER',
    defaultMessage:
      'Core contributors show up in the Team section of your page and can create events, but can't change settings or approve expenses.',
  },
  [roles.ACCOUNTANT]: {
    id: 'RoleDetails.ACCOUNTANT',
    defaultMessage:
      "Accountants can access financial information, such as receipts, invoices, and reports. They can't change settings or approve expenses.",
  },
});

export const hasRoleDescription = role => {
  return Boolean(ROLES_DETAILS[role]);
};

const MemberRoleDescription = ({ role }) => {
  const intl = useIntl();
  return hasRoleDescription(role) ? intl.formatMessage(ROLES_DETAILS[role]) : null;
};

MemberRoleDescription.propTypes = {
  role: PropTypes.oneOf(Object.values(roles)),
};

export default MemberRoleDescription;

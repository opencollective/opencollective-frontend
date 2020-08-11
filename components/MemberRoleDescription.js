import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import roles from '../lib/constants/roles';

const ROLES_DETAILS = defineMessages({
  [roles.ADMIN]: {
    id: 'RoleDetails.ADMIN',
    defaultMessage:
      'Admins have full permissions on the profile, and can in particular change the settings, approve expenses or make financial contributions to other Collectives.',
  },
  [roles.MEMBER]: {
    id: 'RoleDetails.MEMBER',
    defaultMessage:
      'Core contributors are team members that you want to showcase on the profile page. Their only special permission is to create events.',
  },
  [roles.ACCOUNTANT]: {
    id: 'RoleDetails.ACCOUNTANT',
    defaultMessage:
      "Accountants can access all the financial information such as receipts, financial reports or expense's invoices.",
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

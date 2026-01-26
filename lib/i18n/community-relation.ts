import type { CommunityRelationType } from '../graphql/types/v2/graphql';
import { MemberRole } from '../graphql/types/v2/schema';

import formatMemberRole from './member-role';

export const formatCommunityRelation = (intl, role: CommunityRelationType | MemberRole | 'VENDOR') => {
  if (role in MemberRole) {
    return formatMemberRole(intl, role as MemberRole);
  } else {
    switch (role) {
      case 'PAYEE':
        return intl.formatMessage({ defaultMessage: 'Payee', id: 'SecurityScope.Payee' });
      case 'EXPENSE_SUBMITTER':
        return intl.formatMessage({ defaultMessage: 'Expense Submitter', id: 'AM5w9L' });
      case 'GRANTEE':
        return intl.formatMessage({ defaultMessage: 'Grantee', id: 'Grantee' });
      case 'EXPENSE_APPROVER':
        return intl.formatMessage({ defaultMessage: 'Expense Approver', id: 'ExpenseApprover' });
      case 'VENDOR':
        return intl.formatMessage({ defaultMessage: 'Vendor', id: 'dU1t5Z' });
      default:
        return role;
    }
  }
};

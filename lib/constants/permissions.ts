import { defineMessages } from 'react-intl';

const REASON_CODES = {
  UNSUPPORTED_STATUS: 'UNSUPPORTED_STATUS',
  UNSUPPORTED_USER_FEATURE: 'UNSUPPORTED_USER_FEATURE',
  MINIMAL_CONDITION_NOT_MET: 'MINIMAL_CONDITION_NOT_MET',
  AUTHOR_CANNOT_APPROVE: 'AUTHOR_CANNOT_APPROVE',
};

export const ReasonMessage = defineMessages({
  [REASON_CODES.AUTHOR_CANNOT_APPROVE]: {
    id: 'ExpensePermissionReason.AUTHOR_CANNOT_APPROVE',
    defaultMessage:
      'You cannot approve expenses you have submitted{amount, select, 0 {.} other { when the expense is above {amount} {currency}.}}',
  },
});

export default REASON_CODES;

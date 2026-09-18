import { ExpenseStatus, ExpenseStatusFilter } from './graphql/types/v2/graphql';

/**
 * Meta expense statuses, that do not have a corresponding `ExpenseStatus` and are only used for filtering.
 */
export const ExpenseMetaStatuses = [ExpenseStatusFilter.READY_TO_PAY, ExpenseStatusFilter.ON_HOLD] as const;

/**
 * A hold only applies to approved expenses. The flag can be stale on expenses that left that state,
 * so it must not mask the real status.
 */
export const isExpenseOnHold = (expense: { status?: ExpenseStatus | `${ExpenseStatus}`; onHold?: boolean }) =>
  Boolean(expense?.onHold) && expense.status === ExpenseStatus.APPROVED;

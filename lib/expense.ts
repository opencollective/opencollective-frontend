import { ExpenseStatusFilter } from './graphql/types/v2/schema';

/**
 * Meta expense statuses, that do not have a corresponding `ExpenseStatus` and are only used for filtering.
 */
export const ExpenseMetaStatuses = [ExpenseStatusFilter.READY_TO_PAY, ExpenseStatusFilter.ON_HOLD] as const;

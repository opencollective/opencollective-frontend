/** @module constants/transactions */

/** Percentage that Open Collective charges per transaction: 5% */
export const OC_FEE_PERCENT = 5;

/** Default per transaction host fee percentage */
export const HOST_FEE_PERCENT = 5;

/** Types of Transactions */
export const TransactionTypes = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
};

export const TransactionKind = {
  /** Transactions coming from the "Add Funds" */
  ADDED_FUNDS: 'ADDED_FUNDS',
  /** Transactions coming from the "Contribution Flow" */
  CONTRIBUTION: 'CONTRIBUTION',
  /** Transactions coming from the "Expense Flow" */
  EXPENSE: 'EXPENSE',
  /** The host fee going to the Host */
  HOST_FEE: 'HOST_FEE',
  /** Part of the Host fee going from the Host to the Platform */
  HOST_FEE_SHARE: 'HOST_FEE_SHARE',
  /** Reserved keyword in case we want to use in the future */
  PAYMENT_PROCESSOR_FEE: 'PAYMENT_PROCESSOR_FEE',
  /** Reserved keyword in case we want to use in the future */
  PLATFORM_FEE: 'PLATFORM_FEE',
  /** Financial contribution to Open Collective added on top of another contribution */
  PLATFORM_TIP: 'PLATFORM_TIP',
  /** For prepaid budgets */
  PREPAID_PAYMENT_METHOD: 'PREPAID_PAYMENT_METHOD',
};

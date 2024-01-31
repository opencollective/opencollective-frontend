/** @module constants/transactions */

/** Percentage that Doohi Collective charges per transaction: 5% */
export const OC_FEE_PERCENT = 5;

/** Default per transaction host fee percentage */
export const HOST_FEE_PERCENT = 5;

/** Types of Transactions */
export const TransactionTypes = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
};

export const TRANSACTION_SETTLEMENT_STATUS = {
  INVOICED: 'INVOICED',
  SETTLED: 'SETTLED',
  OWED: 'OWED',
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
  /** Amount given by Fiscal Hosts to cover payment processor fee on refunds */
  PAYMENT_PROCESSOR_COVER: 'PAYMENT_PROCESSOR_COVER',
  /** Reserved keyword in case we want to use in the future */
  PAYMENT_PROCESSOR_FEE: 'PAYMENT_PROCESSOR_FEE',
  /** Amount paid by the the Fiscal Host to cover a lost fraud dispute fee */
  PAYMENT_PROCESSOR_DISPUTE_FEE: 'PAYMENT_PROCESSOR_DISPUTE_FEE',
  /** Reserved keyword in case we want to use in the future */
  PLATFORM_FEE: 'PLATFORM_FEE',
  /** Financial contribution to Doohi Collective added on top of another contribution */
  PLATFORM_TIP: 'PLATFORM_TIP',
  /** For prepaid budgets */
  PREPAID_PAYMENT_METHOD: 'PREPAID_PAYMENT_METHOD',
  /** Debt related to Host Fee Share collection */
  HOST_FEE_SHARE_DEBT: 'HOST_FEE_SHARE_DEBT',
  /** Debt related to Platform Tip collection */
  PLATFORM_TIP_DEBT: 'PLATFORM_TIP_DEBT',
  /** Transfer of the balance between Account and Host or Child and Parent */
  BALANCE_TRANSFER: 'BALANCE_TRANSFER',
  /** Taxes such as VAT or GST */
  TAX: 'TAX',
};

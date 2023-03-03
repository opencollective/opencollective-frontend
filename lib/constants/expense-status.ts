/**
 * Constants for the expense status
 *
 *
 * pending -> rejected
 * pending -> approved -> paid
 *
 * TransferWise:
 * ... -> approved -> processing -> paid
 * ... -> approved -> processing -> error
 *
 * PayPal Payouts:
 * ... -> approved -> scheduled_for_payment -> paid
 * ... -> approved -> scheduled_for_payment -> error
 *
 * Submit on Behalf:
 * draft -> unverified -> pending -> ...
 *
 * COMPLETED and REFUNDED status are for displaying refunded expenses and refunds
 * in the transactions list (in both cases the expense status is APPROVED).
 */

export default {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PROCESSING: 'PROCESSING',
  ERROR: 'ERROR',
  PAID: 'PAID',
  SCHEDULED_FOR_PAYMENT: 'SCHEDULED_FOR_PAYMENT',
  SPAM: 'SPAM',
  UNVERIFIED: 'UNVERIFIED',
  INCOMPLETE: 'INCOMPLETE',
} as const;

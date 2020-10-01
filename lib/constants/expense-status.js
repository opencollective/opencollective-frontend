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
 * draft -> pending -> ...
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
};

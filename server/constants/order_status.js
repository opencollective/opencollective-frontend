/*
 * Constants for the order status
 *
 * pending -> paid (one-time)
 * pending -> active (subscription)
 * pending -> active -> cancelled (subscription)
 * pending -> cancelled
 * pending -> rejected
*/

export default {
  PENDING: 'PENDING',
  PAID: 'PAID',
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
  ERROR: 'ERROR',
};

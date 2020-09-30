/*
 * Constants for the order status
 *
 * pending -> paid (one-time)
 * pending -> active (subscription)
 * pending -> active -> cancelled (subscription)
 * pending -> cancelled
 * pending -> expired
 */

export const ORDER_STATUS = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  ERROR: 'ERROR',
  EXPIRED: 'EXPIRED',
  NEW: 'NEW',
  PAID: 'PAID',
  PENDING: 'PENDING',
  PLEDGED: 'PLEDGED',
  REJECTED: 'REJECTED',
  REQUIRE_CLIENT_CONFIRMATION: 'REQUIRE_CLIENT_CONFIRMATION',
};

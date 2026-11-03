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
  DISPUTED: 'DISPUTED',
  ERROR: 'ERROR',
  EXPIRED: 'EXPIRED',
  IN_REVIEW: 'IN_REVIEW',
  NEW: 'NEW',
  PAID: 'PAID',
  PENDING: 'PENDING',
  PAUSED: 'PAUSED',
  PROCESSING: 'PROCESSING',
  REFUNDED: 'REFUNDED',
  REJECTED: 'REJECTED',
  REQUIRE_CLIENT_CONFIRMATION: 'REQUIRE_CLIENT_CONFIRMATION',
};

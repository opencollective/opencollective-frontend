/**
 * Constants for the expense status
 *
 * pending -> rejected
 * pending -> approved -> paid
 * pending -> approved -> processing -> paid [On async transfers like TransferWise]
 * pending -> approved -> processing -> error [On async transfers like TransferWise]
 */

export default {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PROCESSING: 'PROCESSING',
  ERROR: 'ERROR',
  PAID: 'PAID',
};

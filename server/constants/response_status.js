/**
 * Constants for the expense status
 *
 * pending -> yes
 * pending -> no
 * pending -> interested -> yes
 * pending -> interested -> no
 * pending -> processed (if payment accepted to join a tier for example)
 */

export default {
  PENDING: 'PENDING',
  INTERESTED: 'INTERESTED',
  YES: 'YES',
  NO: 'NO',
  PROCESSED: 'PROCESSED'
};
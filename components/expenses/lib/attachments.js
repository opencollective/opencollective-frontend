import expenseTypes from '../../../lib/constants/expenseTypes';

export const attachmentDropzoneParams = {
  accept: 'image/jpeg, image/png, application/pdf',
  minSize: 1024, // in bytes, =1ko
  maxSize: 10000 * 1024, // in bytes, =10mo
};

/**
 * Returns true if the attachment require adding a file
 */
export const attachmentRequiresFile = expenseType => {
  return expenseType === expenseTypes.RECEIPT || expenseType === expenseTypes.CHARGE;
};

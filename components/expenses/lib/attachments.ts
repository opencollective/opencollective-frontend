import expenseTypes from '../../../lib/constants/expenseTypes';

import { DROPZONE_ACCEPT_ALL } from '../../StyledDropzone';

export const attachmentDropzoneParams = {
  accept: DROPZONE_ACCEPT_ALL,
  minSize: 1024, // in bytes, =1ko
  maxSize: 10000 * 1024, // in bytes, =10mo
};

/**
 * Returns true if the attachment require adding a file
 */
export const attachmentRequiresFile = (expenseType: string) => {
  return expenseType === expenseTypes.RECEIPT || expenseType === expenseTypes.CHARGE;
};

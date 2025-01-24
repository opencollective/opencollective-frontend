import { ExpenseType } from '../../../lib/graphql/types/v2/schema';

import { DROPZONE_ACCEPT_ALL } from '../../Dropzone';

export const attachmentDropzoneParams = {
  accept: DROPZONE_ACCEPT_ALL,
  minSize: 10e2, // in bytes, =1kB
  maxSize: 10e6, // in bytes, =10MB
  limit: 15, // Max 15 files per upload
};

export const expenseTypeSupportsAttachments = (type: ExpenseType) => {
  return type === ExpenseType.INVOICE || type === ExpenseType.GRANT || type === ExpenseType.SETTLEMENT;
};

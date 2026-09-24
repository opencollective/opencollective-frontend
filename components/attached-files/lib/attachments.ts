import { DROPZONE_ACCEPT_ALL } from '../../Dropzone';

export const attachmentDropzoneParams = {
  accept: DROPZONE_ACCEPT_ALL,
  minSize: 10e2, // in bytes, =1kB
  maxSize: 10e6, // in bytes, =10MB
};

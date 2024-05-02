import { round } from 'lodash';

export const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1000) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1000e3) {
    return `${round(sizeInBytes / 1000, 2)} KB`;
  } else {
    return `${round(sizeInBytes / 1000e3, 2)} MB`;
  }
};

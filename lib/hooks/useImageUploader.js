import React from 'react';
import { pick } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';

import I18nFormatters from '../../components/I18nFormatters';
import { TOAST_TYPE, useToasts } from '../../components/ToastProvider';

import { uploadImageWithXHR } from '../api';
import { allSettled } from '../utils';

const msg = defineMessages({
  invalidFiles: {
    id: 'StyledDropzone.InvalidFiles',
    defaultMessage: 'The following {count, plural, one {file is} other {files are}} not valid: {files}',
  },
  'file-invalid-type': {
    id: 'StyledDropzone.FileInvalidType',
    defaultMessage: 'Filetype error: only {availableExtensions} is supported',
  },
});

/** Fets the average progress from a list of upload progress */
const getUploadProgress = uploadProgressList => {
  if (!uploadProgressList || uploadProgressList.length === 0) {
    return 0;
  } else {
    const totalUploadProgress = uploadProgressList.reduce((total, current) => total + current, 0);
    return Math.trunc(totalUploadProgress / uploadProgressList.length);
  }
};

export const useImageUploader = ({ isMulti, mockImageGenerator, onSuccess, onReject, kind, accept }) => {
  const [isUploading, setUploading] = React.useState(false);
  const [uploadProgressList, setUploadProgressList] = React.useState([]);
  const { addToast } = useToasts();
  const intl = useIntl();
  return {
    isUploading,
    uploadProgress: getUploadProgress(uploadProgressList),
    uploadFiles: React.useCallback(
      async (acceptedFiles, rejectedFiles) => {
        setUploading(true);
        const filesToUpload = isMulti ? acceptedFiles : [acceptedFiles[0]];
        const results = await allSettled(
          filesToUpload.map((file, index) =>
            uploadImageWithXHR(file, kind, {
              mockImage: mockImageGenerator && mockImageGenerator(index),
              onProgress: progress => {
                const newProgressList = [...uploadProgressList];
                newProgressList.splice(index, 0, progress);
                setUploadProgressList(newProgressList);
              },
            }),
          ),
        );

        setUploading(false);

        const successes = [];
        const failures = [];
        results.forEach((result, index) => {
          const fileInfo = pick(filesToUpload[index], ['name', 'size', 'type']);
          if (result.status === 'fulfilled') {
            successes.push({ url: result.value, ...fileInfo });
          } else {
            failures.push({ message: result.reason, ...fileInfo });
          }
        });

        if (onSuccess && successes.length > 0) {
          await onSuccess(isMulti ? successes : successes[0]);
        }

        if (onReject && failures.length > 0) {
          onReject(isMulti ? failures : failures[0]);
        }

        if (rejectedFiles?.length) {
          const baseMsg = intl.formatMessage(msg.invalidFiles, {
            ...I18nFormatters,
            count: rejectedFiles.length,
            files: rejectedFiles.map(({ file }) => file.name).join(', '),
          });

          const availableExtensions = Object.values(accept).flat().join(', ').toUpperCase();
          const [firstRejectedFile] = rejectedFiles;
          const [firstError] = firstRejectedFile.errors;
          const { code, message } = firstError;
          const errorMsg = msg[code]
            ? intl.formatMessage(msg[code], { ...I18nFormatters, availableExtensions })
            : message;

          addToast({ type: TOAST_TYPE.ERROR, message: `${baseMsg}. ${errorMsg}` });
        }
      },
      [isMulti, onSuccess, onReject, mockImageGenerator, uploadProgressList],
    ),
  };
};

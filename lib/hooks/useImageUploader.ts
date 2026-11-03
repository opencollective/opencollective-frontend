import React from 'react';
import { pick } from 'lodash-es';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';

import I18nFormatters from '../../components/I18nFormatters';
import { useToast } from '../../components/ui/useToast';

import { uploadImageWithXHR } from '../api';
import { formatFileSize } from '../file-utils';
import { allSettled } from '../utils';

type UploadedFileInfo = {
  name?: string;
  size?: number;
  type?: string;
};

type RejectedFile = {
  file: File;
  errors: readonly { code: string; message: string }[];
};

type ImageUploaderOptions = {
  isMulti?: boolean;
  mockImageGenerator?: (index: number) => string | boolean;
  onSuccess?: (files: unknown, rejectedFiles?: unknown) => void;
  onReject?: (files: unknown, rejectedFiles?: unknown) => void;
  kind?: string;
  accept?: Record<string, readonly string[]>;
  minSize?: number;
  maxSize?: number;
};

/** Gets the average progress from a list of upload progress */
const getUploadProgress = (uploadProgressList: number[]): number => {
  if (!uploadProgressList || uploadProgressList.length === 0) {
    return 0;
  } else {
    const totalUploadProgress = uploadProgressList.reduce((total, current) => total + current, 0);
    return Math.trunc(totalUploadProgress / uploadProgressList.length);
  }
};

export const useImageUploader = ({
  isMulti,
  mockImageGenerator,
  onSuccess,
  onReject = undefined,
  kind,
  accept,
  minSize = undefined,
  maxSize = undefined,
}: ImageUploaderOptions) => {
  const [isUploading, setUploading] = React.useState(false);
  const [uploadProgressList, setUploadProgressList] = React.useState<number[]>([]);
  const { toast } = useToast();
  const intl = useIntl();
  return {
    isUploading,
    uploadProgress: getUploadProgress(uploadProgressList),
    uploadFiles: React.useCallback(
      async (acceptedFiles: File[], rejectedFiles: RejectedFile[]) => {
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
          const fileInfo: UploadedFileInfo = pick(filesToUpload[index], ['name', 'size', 'type']);
          if (result.status === 'fulfilled') {
            successes.push({ url: result.value, ...fileInfo });
          } else {
            failures.push({ message: result.reason?.message, ...fileInfo });
          }
        });

        if (onSuccess && successes.length > 0) {
          await onSuccess(isMulti ? successes : successes[0]);
        }
        if (failures.length > 0) {
          if (onReject) {
            onReject(isMulti ? failures : failures[0]);
          } else {
            toast({
              variant: 'error',
              message:
                failures[0]?.message ||
                intl.formatMessage({
                  id: 'ImageUpload.Failed',
                  defaultMessage: 'Image upload failed. Please try again later.',
                }),
            });
          }
        }

        if (rejectedFiles?.length) {
          toast({
            variant: 'error',
            message: getMessageForRejectedDropzoneFiles(intl, rejectedFiles, accept, { minSize, maxSize }),
          });
        }
      },
      [isMulti, onSuccess, onReject, mockImageGenerator, uploadProgressList],
    ),
  };
};

export const getMessageForRejectedDropzoneFiles = (
  intl: IntlShape,
  rejectedFiles: RejectedFile[],
  accept: Record<string, readonly string[]>,
  { minSize, maxSize }: { minSize?: number; maxSize?: number } = {},
): string => {
  const baseMsg = intl.formatMessage(
    {
      id: 'StyledDropzone.InvalidFiles',
      defaultMessage: 'The following {count, plural, one {file is} other {files are}} not valid: {files}',
    },
    {
      ...I18nFormatters,
      count: rejectedFiles.length,
      files: rejectedFiles.map(({ file }) => file.name).join(', '),
    },
  );

  const availableExtensions = Object.values(accept).flat().join(', ').toUpperCase();
  const [firstRejectedFile] = rejectedFiles;
  const [firstError] = firstRejectedFile.errors;
  const { code, message } = firstError;
  let errorMsg = message;

  if (code === 'file-too-large' && maxSize) {
    errorMsg = intl.formatMessage(
      { id: 'StyledDropzone.FileTooLarge', defaultMessage: 'File is larger than {maxSize}.' },
      { maxSize: formatFileSize(maxSize) },
    );
  } else if (code === 'file-too-small' && minSize) {
    errorMsg = intl.formatMessage(
      { id: 'StyledDropzone.FileTooSmall', defaultMessage: 'File is smaller than {minSize}.' },
      { minSize: formatFileSize(minSize) },
    );
  } else if (code === 'invalid-file-type') {
    errorMsg = intl.formatMessage(
      {
        id: '5yfmfv',
        defaultMessage: 'File type is not supported. Supported file types are: {availableExtensions}.',
      },
      { availableExtensions },
    );
  }

  return `${baseMsg}. ${errorMsg}`;
};

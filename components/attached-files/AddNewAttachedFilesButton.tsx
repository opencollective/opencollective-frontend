import React from 'react';
import ReactDropzone from 'react-dropzone';
import { FormattedMessage } from 'react-intl';

import { useImageUploader } from '../../lib/hooks/useImageUploader';
import { attachmentDropzoneParams } from './lib/attachments';

import StyledButton from '../StyledButton';

interface AddNewAttachedFilesButtonProps {
  disabled?: boolean;
  onSuccess?(...args: unknown[]): unknown;
  mockImageGenerator?(...args: unknown[]): unknown;
}

const AddNewAttachedFilesButton = ({
  disabled,
  mockImageGenerator,
  onSuccess,
  isMulti,
  kind
}: AddNewAttachedFilesButtonProps) => {
  const { isUploading, uploadFiles } = useImageUploader({
    isMulti,
    mockImageGenerator,
    onSuccess,
    kind,
    accept: attachmentDropzoneParams.accept,
  });

  return (
    <ReactDropzone {...attachmentDropzoneParams} disabled={disabled} multiple={true} onDrop={uploadFiles}>
      {({ getRootProps, getInputProps }) => (
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <StyledButton buttonSize="tiny" type="button" minWidth={135} disabled={disabled} loading={isUploading}>
            +&nbsp;
            <FormattedMessage id="ExpenseForm.AddAttachedFile" defaultMessage="Add new document" />
          </StyledButton>
        </div>
      )}
    </ReactDropzone>
  );
};

export default AddNewAttachedFilesButton;

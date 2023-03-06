import React from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';
import { FormattedMessage } from 'react-intl';

import { useImageUploader } from '../../lib/hooks/useImageUploader';
import { attachmentDropzoneParams } from './lib/attachments';

import StyledButton from '../StyledButton';

const AddNewAttachedFilesButton = ({ disabled, mockImageGenerator, onSuccess }) => {
  const { isUploading, uploadFiles } = useImageUploader({
    isMulti: true,
    mockImageGenerator,
    onSuccess,
    kind: 'EXPENSE_ATTACHED_FILE',
    accept: attachmentDropzoneParams.accept,
  });

  return (
    <Dropzone
      {...attachmentDropzoneParams}
      name="addAttachedFile"
      disabled={disabled}
      multiple={true}
      onDrop={uploadFiles}
    >
      {({ getRootProps, getInputProps }) => (
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <StyledButton
            buttonSize="tiny"
            type="button"
            minWidth={135}
            data-cy="expense-add-item-btn"
            disabled={disabled}
            loading={isUploading}
          >
            +&nbsp;
            <FormattedMessage id="ExpenseForm.AddAttachedFile" defaultMessage="Add new document" />
          </StyledButton>
        </div>
      )}
    </Dropzone>
  );
};

AddNewAttachedFilesButton.propTypes = {
  disabled: PropTypes.bool,
  onSuccess: PropTypes.func,
  mockImageGenerator: PropTypes.func,
};

export default AddNewAttachedFilesButton;

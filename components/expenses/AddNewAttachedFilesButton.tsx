import React from 'react';
import type { FileRejection } from 'react-dropzone';
import Dropzone from 'react-dropzone';
import { FormattedMessage, useIntl } from 'react-intl';

import type { OcrParsingOptionsInput, UploadFileResult } from '../../lib/graphql/types/v2/graphql';
import { useGraphQLFileUploader } from '../../lib/hooks/useGraphQLFileUploader';
import { getMessageForRejectedDropzoneFiles, useImageUploader } from '../../lib/hooks/useImageUploader';
import { attachmentDropzoneParams } from './lib/attachments';

import StyledButton from '../StyledButton';
import { toast } from '../ui/useToast';

const AddNewAttachedFilesButton = ({
  disabled,
  mockImageGenerator,
  onSuccess,
  parseDocument = false,
  parsingOptions = null,
  useGraphQL = false,
  onGraphQLSuccess = undefined,
}: AddNewAttachedFilesButtonProps) => {
  const kind = 'EXPENSE_ATTACHED_FILE';
  const intl = useIntl();
  const { isUploading, uploadFiles } = useImageUploader({
    isMulti: true,
    mockImageGenerator,
    onSuccess,
    kind,
    accept: attachmentDropzoneParams.accept,
  });

  const { isUploading: isUploadingWithGraphQL, uploadFile: uploadFileWithGraphQL } = useGraphQLFileUploader({
    mockImageGenerator,
    onSuccess: onGraphQLSuccess,
  });

  const onDrop = React.useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections?.length) {
        toast({
          variant: 'error',
          message: getMessageForRejectedDropzoneFiles(intl, fileRejections, attachmentDropzoneParams.accept),
        });
      } else if (useGraphQL) {
        uploadFileWithGraphQL(acceptedFiles.map(file => ({ file, kind, parseDocument, parsingOptions })));
      } else {
        uploadFiles(acceptedFiles, fileRejections);
      }
    },
    [onSuccess, uploadFiles],
  );

  return (
    <Dropzone {...attachmentDropzoneParams} disabled={disabled} multiple={true} onDrop={onDrop}>
      {({ getRootProps, getInputProps }) => (
        <div {...getRootProps()}>
          <input name="addAttachedFile" {...getInputProps()} />
          <StyledButton
            buttonSize="tiny"
            type="button"
            minWidth={135}
            data-cy="expense-add-item-btn"
            disabled={disabled}
            loading={isUploading || isUploadingWithGraphQL}
          >
            +&nbsp;
            <FormattedMessage id="ExpenseForm.AddAttachedFile" defaultMessage="Add new document" />
          </StyledButton>
        </div>
      )}
    </Dropzone>
  );
};

type AddNewAttachedFilesButtonProps = {
  disabled?: boolean;
  onSuccess: (newFiles: Array<{ url: string }>) => void;
  mockImageGenerator?: () => string;
  useGraphQL?: boolean;
  parseDocument?: boolean;
  parsingOptions?: OcrParsingOptionsInput;
  onGraphQLSuccess?: (uploadResults: UploadFileResult[]) => void;
};

export default AddNewAttachedFilesButton;

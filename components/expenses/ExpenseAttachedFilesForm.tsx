import React from 'react';
import { uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import type { Account, UploadedFileKind } from '../../lib/graphql/types/v2/schema';
import { attachmentDropzoneParams } from './lib/attachments';

import Dropzone from '../Dropzone';
import { Flex } from '../Grid';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import StyledHr from '../StyledHr';
import { P, Span } from '../Text';

import AddNewAttachedFilesButton from './AddNewAttachedFilesButton';
import ExpenseAttachedFiles from './ExpenseAttachedFiles';

const ExpenseAttachedFilesForm = ({
  disabled,
  defaultValue,
  title,
  description,
  onChange,
  fieldName = 'attachedFiles',
  isSingle = false,
  kind,
}: ExpenseAttachedFilesFormProps) => {
  const [files, setFiles] = React.useState(uniqBy(defaultValue, 'url'));

  return (
    <div>
      <Flex alignItems="center" my={16}>
        <Span color="black.600" fontSize="16px" lineHeight="21px">
          <FormattedMessage
            id="OptionalFieldLabel"
            defaultMessage="{field} (optional)"
            values={{
              field: (
                <Span color="black.900" fontSize="16px" fontWeight="bold">
                  {title}
                </Span>
              ),
            }}
          />
          &nbsp;
          <PrivateInfoIcon className="text-muted-foreground" />
        </Span>
        <StyledHr flex="1" borderColor="black.300" mx={2} />
        {files?.length > 0 && !isSingle && (
          <AddNewAttachedFilesButton
            disabled={disabled}
            onSuccess={newFiles => {
              const uploadedFiles = [...files, ...newFiles];
              setFiles(uploadedFiles);
              onChange(uploadedFiles);
            }}
          />
        )}
      </Flex>
      <P fontSize="13px" color="black.600" mb={16}>
        {description}
      </P>
      {files?.length > 0 ? (
        <ExpenseAttachedFiles
          files={files}
          onRemove={idx => {
            const updatedFiles = [...files];
            updatedFiles.splice(idx, 1);
            setFiles(updatedFiles);
            onChange(updatedFiles);
          }}
        />
      ) : (
        <Dropzone
          {...attachmentDropzoneParams}
          isMulti={!isSingle}
          name={fieldName}
          kind={kind || 'EXPENSE_ATTACHED_FILE'}
          disabled={disabled}
          minHeight={72}
          onSuccess={uploadedFiles => {
            let value = uploadedFiles;
            if (!Array.isArray(uploadedFiles)) {
              value = [uploadedFiles];
            }
            setFiles(value);
            onChange(value);
          }}
        />
      )}
    </div>
  );
};

type ExpenseAttachedFilesFormProps = {
  defaultValue?: Array<{ url: string }>;
  title: React.ReactNode;
  description: React.ReactNode;
  disabled?: boolean;
  hasOCRFeature?: boolean;
  collective?: Account;
  fieldName?: string;
  isSingle?: boolean;
  kind?: UploadedFileKind;
  onChange: (attachedFiles: Array<{ url: string }>) => void;
};

export default ExpenseAttachedFilesForm;

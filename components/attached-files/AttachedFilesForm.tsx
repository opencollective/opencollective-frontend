import React from 'react';
import { uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import type { UploadedFileKind } from '../../lib/graphql/types/v2/graphql';
import { attachmentDropzoneParams } from './lib/attachments';

import { Flex } from '../Grid';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import StyledDropzone from '../StyledDropzone';
import StyledHr from '../StyledHr';
import { P, Span } from '../Text';

import AddNewAttachedFilesButton from './AddNewAttachedFilesButton';
import AttachedFiles from './AttachedFiles';

type AttachedFilesFormProps = {
  onChange: (files: any) => void;
  disabled?: boolean;
  defaultValue?: any;
  title: React.ReactNode;
  description?: React.ReactNode;
  isMulti?: boolean;
  kind: UploadedFileKind | `${UploadedFileKind}`;
  name: string;
  openFileViewer?: (fileUrl: string) => void;
};

const AttachedFilesForm = ({
  onChange,
  disabled,
  defaultValue,
  title,
  description = null,
  isMulti = true,
  kind,
  name,
  openFileViewer,
}: AttachedFilesFormProps) => {
  const [files, setFiles] = React.useState(isMulti ? uniqBy(defaultValue, 'url') : defaultValue ? [defaultValue] : []);
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
          <PrivateInfoIcon className="text-muted-foreground" size={12} />
        </Span>
        <StyledHr flex="1" borderColor="black.300" mx={2} />
        {isMulti && files?.length > 0 && (
          <AddNewAttachedFilesButton
            isMulti={isMulti}
            kind={kind}
            disabled={disabled}
            onSuccess={data => {
              const uploadedFiles = [...files, data];
              setFiles(uploadedFiles);
              onChange(data);
            }}
          />
        )}
      </Flex>
      {description && (
        <P fontSize="13px" color="black.600" mb={16}>
          {description}
        </P>
      )}
      {files?.length > 0 ? (
        <AttachedFiles
          files={files}
          openFileViewer={openFileViewer}
          onRemove={idx => {
            let updatedFiles = null;
            if (isMulti) {
              updatedFiles = [...files];
              updatedFiles.splice(idx, 1);
            }

            setFiles(updatedFiles);
            onChange(updatedFiles);
          }}
        />
      ) : (
        <StyledDropzone
          {...attachmentDropzoneParams}
          name={name}
          kind={kind}
          isMulti={isMulti}
          disabled={Boolean(disabled)}
          minHeight={72}
          collectFilesOnly={true}
          onSuccess={data => {
            setFiles(data);
            onChange(data[0]);
          }}
        />
      )}
    </div>
  );
};

export default AttachedFilesForm;

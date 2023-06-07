import React from 'react';
import { ExclamationCircle } from '@styled-icons/fa-solid/ExclamationCircle';
import { Download as DownloadIcon } from '@styled-icons/feather/Download';
import { isNil, omit } from 'lodash';
import { Accept, FileRejection, useDropzone } from 'react-dropzone';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';
import { v4 as uuid } from 'uuid';

import { useImageUploader } from '../lib/hooks/useImageUploader';

import Container from './Container';
import { Box } from './Grid';
import { getI18nLink } from './I18nFormatters';
import StyledSpinner from './StyledSpinner';
import { P, Span } from './Text';
import UploadedFilePreview from './UploadedFilePreview';

export const DROPZONE_ACCEPT_IMAGES = { 'image/*': ['.jpeg', '.png'] };
export const DROPZONE_ACCEPT_PDF = { 'application/pdf': ['.pdf'] };
export const DROPZONE_ACCEPT_ALL = { ...DROPZONE_ACCEPT_IMAGES, ...DROPZONE_ACCEPT_PDF };

const Dropzone = styled(Container)<{ onClick?: () => void; error?: any }>`
  border: 1px dashed #c4c7cc;
  border-radius: 10px;
  text-align: center;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  ${props =>
    props.onClick &&
    css`
      cursor: pointer;

      &:hover:not(:disabled) {
        background: #f9f9f9;
        border-color: ${props => props.theme.colors.primary[300]};
      }

      &:focus {
        outline: 0;
        border-color: ${props => props.theme.colors.primary[500]};
      }
    `}

  ${props =>
    props.error &&
    css`
      border: 1px solid ${props.theme.colors.red[500]};
    `}

  img {
    max-height: 100%;
    max-width: 100%;
  }
`;

const ReplaceContainer = styled.div`
  box-sizing: border-box;
  background: rgba(49, 50, 51, 0.5);
  color: #ffffff;
  cursor: pointer;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 24px;
  padding: 8px;
  margin-top: -24px;
  font-size: 12px;
  line-height: 1em;

  &:hover {
    background: rgba(49, 50, 51, 0.6);
  }
`;

/**
 * A dropzone to upload one or multiple files
 */
const StyledDropzone = ({
  onReject,
  children,
  isLoading,
  loadingProgress,
  minHeight,
  size,
  fontSize,
  mockImageGenerator,
  accept,
  minSize,
  maxSize,
  name,
  error,
  value,
  isMulti,
  kind,
  ...props
}: StyledDropzoneProps) => {
  const imgUploaderParams = { isMulti, mockImageGenerator, onSuccess: props.onSuccess, onReject, kind, accept };
  const { uploadFiles, isUploading, uploadProgress } = useImageUploader(imgUploaderParams);

  const onDrop = React.useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (props.collectFilesOnly) {
        props.onSuccess(acceptedFiles, fileRejections);
      } else {
        uploadFiles(acceptedFiles, fileRejections);
      }
    },
    [props.collectFilesOnly, props.onSuccess, uploadFiles],
  );
  const dropzoneParams = { accept, minSize, maxSize, multiple: isMulti, onDrop };
  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneParams);

  minHeight = size || minHeight;
  const innerMinHeight = minHeight - 2; // -2 To account for the borders
  const dropProps = getRootProps();
  return (
    <Dropzone
      {...props}
      {...(value ? omit(dropProps, ['onClick']) : dropProps)}
      minHeight={size || minHeight}
      size={size}
      error={error}
    >
      <input name={name} {...getInputProps()} />
      {isLoading || isUploading ? (
        <Container
          position="relative"
          display="flex"
          justifyContent="center"
          alignItems="center"
          size="100%"
          minHeight={innerMinHeight}
        >
          <Container
            position="absolute"
            display="flex"
            justifyContent="center"
            alignItems="center"
            size={innerMinHeight}
          >
            <StyledSpinner size="70%" />
          </Container>
          {isUploading && <Container fontSize="9px">{uploadProgress}%</Container>}
          {isLoading && !isNil(loadingProgress) && <Container>{loadingProgress}%</Container>}
        </Container>
      ) : (
        <Container position="relative">
          {isDragActive ? (
            <Container color="primary.500" fontSize="12px">
              <Box mb={2}>
                <DownloadIcon size={20} />
              </Box>
              <FormattedMessage
                id="StyledDropzone.DropMsg"
                defaultMessage="Drop {count,plural, one {file} other {files}} here"
                values={{ count: isMulti ? 2 : 1 }}
              />
            </Container>
          ) : (
            <React.Fragment>
              {!value ? (
                <P color={error ? 'red.500' : 'black.500'} px={2} fontSize={fontSize}>
                  {error ? (
                    <React.Fragment>
                      <ExclamationCircle color="#E03F6A" size={16} />
                      <br />
                      <Span fontWeight={600} ml={1}>
                        {error}
                      </Span>
                      <br />
                    </React.Fragment>
                  ) : isMulti ? (
                    <FormattedMessage
                      id="DropZone.UploadBox"
                      defaultMessage="Drag and drop one or multiple files or <i18n-link>click here to select</i18n-link>."
                      values={{ 'i18n-link': getI18nLink() }}
                    />
                  ) : (
                    <FormattedMessage
                      id="DragAndDropOrClickToUpload"
                      defaultMessage="Drag & drop or <i18n-link>click to upload</i18n-link>"
                      values={{ 'i18n-link': getI18nLink() }}
                      tagName="span"
                    />
                  )}
                </P>
              ) : (
                <React.Fragment>
                  <UploadedFilePreview size={size} url={value} border="none" />
                  <ReplaceContainer
                    onClick={dropProps.onClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        dropProps.onClick(null);
                      }
                    }}
                  >
                    <FormattedMessage id="Image.Replace" defaultMessage="Replace" />
                  </ReplaceContainer>
                </React.Fragment>
              )}
              {children}
            </React.Fragment>
          )}
        </Container>
      )}
    </Dropzone>
  );
};

type StyledDropzoneProps = {
  /** Called back with the rejectd files */
  onReject: () => void;
  /** Name for the input */
  name: string;
  /** Content to show inside the dropzone. Defaults to message "Drag and drop one or..." */
  children: React.ReactChildren;
  /** Force loading state to be displayed */
  isLoading: boolean;
  /** Use this to override the loading progress indicator */
  loadingProgress: number;
  /** Font size used for the default messages */
  fontSize: number | string;
  /** Min height of the container */
  minHeight: number;
  /** To have square container */
  size: number;
  /** A function to generate mock images */
  mockImageGenerator: () => void;
  /** Filetypes to accept */
  accept: Accept;
  /** Min file size */
  minSize: number;
  /** Max file size */
  maxSize: number;
  /** A truthy/falsy value defining if the field has an error (ie. if it's required) */
  error: any;
  /** required field */
  required: boolean;
  /** if set, the image will be displayed and a "replace" banner will be added */
  value: string;
  /** A unique identified for the category of uploaded files */
  kind: string;
} & (
  | {
      /** Collect File only, do not upload files */
      collectFilesOnly: true;
      /** Whether the dropzone should accept multiple files */
      isMulti?: boolean;
      /** Called back with the uploaded files on success */
      onSuccess: (acceptedFiles: File[], fileRejections: FileRejection[]) => void;
    }
  | ({
      collectFilesOnly?: false;
    } & (
      | {
          isMulti?: true;
          /** Called back with the uploaded files on success */
          onSuccess: (fileUrls: string[]) => void;
        }
      | {
          isMulti: false;
          /** Called back with the uploaded files on success */
          onSuccess: (fileUrls: string) => void;
        }
    ))
);

StyledDropzone.defaultProps = {
  minHeight: 96,
  mockImageGenerator: () => `https://loremflickr.com/120/120?lock=${uuid()}`,
  isMulti: true,
  fontSize: '14px',
  collectFilesOnly: false,
};

export default StyledDropzone;

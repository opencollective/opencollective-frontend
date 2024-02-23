import React from 'react';
import { ExclamationCircle } from '@styled-icons/fa-solid/ExclamationCircle';
import { Download as DownloadIcon } from '@styled-icons/feather/Download';
import { isNil, omit } from 'lodash';
import type { Accept, FileRejection } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';
import { v4 as uuid } from 'uuid';

import type { OcrParsingOptionsInput, UploadedFileKind, UploadFileResult } from '../lib/graphql/types/v2/graphql';
import { useGraphQLFileUploader } from '../lib/hooks/useGraphQLFileUploader';
import { useImageUploader } from '../lib/hooks/useImageUploader';

import { useToast } from './ui/useToast';
import Container from './Container';
import { Box } from './Grid';
import { getI18nLink } from './I18nFormatters';
import LocalFilePreview from './LocalFilePreview';
import StyledSpinner from './StyledSpinner';
import { P, Span } from './Text';
import UploadedFilePreview from './UploadedFilePreview';

// ignore unused exports DROPZONE_ACCEPT_PDF
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
  onReject = undefined,
  onDrop = undefined,
  children = null,
  isLoading = false,
  loadingProgress = undefined,
  minHeight = 96,
  size,
  fontSize = '14px',
  mockImageGenerator = () => `https://loremflickr.com/120/120?lock=${uuid()}`,
  accept,
  minSize,
  maxSize,
  onSuccess,
  collectFilesOnly,
  name,
  error = undefined,
  value,
  isMulti = true,
  useGraphQL = false,
  parseDocument = false,
  parsingOptions = {},
  onGraphQLSuccess = undefined,
  UploadingComponent = undefined,
  limit = undefined,
  kind,
  ...props
}: StyledDropzoneProps) => {
  const { toast } = useToast();
  const intl = useIntl();
  const imgUploaderParams = { isMulti, mockImageGenerator, onSuccess, onReject, kind, accept };
  const { uploadFiles, isUploading, uploadProgress } = useImageUploader(imgUploaderParams);
  const { isUploading: isUploadingWithGraphQL, uploadFile: uploadFileWithGraphQL } = useGraphQLFileUploader({
    mockImageGenerator,
    onSuccess: onGraphQLSuccess,
    onReject,
    isMulti,
  });

  // Sanity checks
  if (parseDocument && !useGraphQL) {
    throw new Error('StyledDropzone: parseDocument can only be used with useGraphQL');
  } else if (parseDocument && collectFilesOnly) {
    throw new Error('StyledDropzone: parseDocument cannot be used with collectFilesOnly');
  }

  const onDropCallback = React.useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (isMulti && acceptedFiles.length > (limit || 0)) {
        toast({
          variant: 'error',
          message: intl.formatMessage(
            { defaultMessage: 'You can only upload {count, plural, one {# file} other {# files}} at once' },
            { count: limit },
          ),
        });
        return;
      }

      onDrop?.(acceptedFiles, fileRejections);
      if (collectFilesOnly) {
        onSuccess?.(acceptedFiles, fileRejections);
      } else if (useGraphQL) {
        uploadFileWithGraphQL(acceptedFiles.map(file => ({ file, kind, parseDocument, parsingOptions })));
      } else {
        uploadFiles(acceptedFiles, fileRejections);
      }
    },
    [collectFilesOnly, onSuccess, uploadFiles, uploadFileWithGraphQL, onDrop],
  );
  const dropzoneParams = { accept, minSize, maxSize, multiple: isMulti, onDrop: onDropCallback };
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
      {isLoading || isUploading || isUploadingWithGraphQL ? (
        <Container
          position="relative"
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
          width="100%"
          minHeight={innerMinHeight}
          data-loading="true"
        >
          <Container
            position="absolute"
            display="flex"
            justifyContent="center"
            alignItems="center"
            size={innerMinHeight}
          >
            {UploadingComponent ? <UploadingComponent /> : <StyledSpinner size="70%" />}
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
              ) : typeof value === 'string' ? (
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
              ) : value instanceof File ? (
                <LocalFilePreview size={size} file={value} />
              ) : null}
              {children}
            </React.Fragment>
          )}
        </Container>
      )}
    </Dropzone>
  );
};

type UploadedFile = {
  name?: string;
  url: string;
  size?: number;
  type: string;
};

type StyledDropzoneProps = {
  /** Called back with the rejected files */
  onReject?: () => void;
  /** Called when the user drops files */
  onDrop?: (acceptedFiles, rejectedFiles) => void;
  /** Name for the input */
  name: string;
  /** Content to show inside the dropzone. Defaults to message "Drag and drop one or..." */
  children?: React.ReactNode;
  /** Force loading state to be displayed */
  isLoading?: boolean;
  /** Use this to override the loading progress indicator */
  loadingProgress?: number;
  /** Font size used for the default messages */
  fontSize?: number | string;
  /** Min height of the container */
  minHeight?: number;
  /** To have square container */
  size?: number;
  /** A function to generate mock images */
  mockImageGenerator?: () => string;
  /** Filetypes to accept */
  accept: Accept;
  /** Min file size */
  minSize: number;
  /** Max file size */
  maxSize: number;
  /** A truthy/falsy value defining if the field has an error (ie. if it's required) */
  error?: any;
  /** required field */
  required?: boolean;
  /** A unique identified for the category of uploaded files */
  kind: UploadedFileKind | `${UploadedFileKind}`;
  /** To disabled the input */
  disabled?: boolean;
  value?: any;
  useGraphQL?: boolean;
  onGraphQLSuccess?: (uploadResults: UploadFileResult[]) => void;
  parseDocument?: boolean;
  parsingOptions?: OcrParsingOptionsInput;
  UploadingComponent?: React.ComponentType;
  /** When isMulti is true, limit the number of files that can be uploaded */
  limit?: number;
} & (
  | {
      /** Collect File only, do not upload files */
      collectFilesOnly: true;
      /** Whether the dropzone should accept multiple files */
      isMulti?: boolean;
      /** Called back with the uploaded files on success */
      onSuccess: (acceptedFiles: File[], fileRejections: FileRejection[]) => void;
      /** if set, the image will be displayed and a "replace" banner will be added */
      value?: File;
    }
  | ({
      collectFilesOnly?: false;
    } & (
      | {
          isMulti?: true;
          /** Called back with the uploaded files on success */
          onSuccess?: (files: UploadedFile[]) => void;
        }
      | {
          isMulti: false;
          /** Called back with the uploaded files on success */
          onSuccess?: (file: UploadedFile) => void;
          /** if set, the image will be displayed and a "replace" banner will be added */
          value?: string;
        }
    ))
);

export default StyledDropzone;

import React from 'react';
import PropTypes from 'prop-types';
import { Download as DownloadIcon } from '@styled-icons/feather/Download';
import { get, isNil, omit, partition } from 'lodash';
import { useDropzone } from 'react-dropzone';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';
import { v4 as uuid } from 'uuid';

import { uploadImageWithXHR } from '../lib/api';
import { getErrorFromXhrUpload } from '../lib/errors';
import { allSettled } from '../lib/utils';

import Container from './Container';
import { Box } from './Grid';
import { getI18nLink } from './I18nFormatters';
import StyledSpinner from './StyledSpinner';
import { P } from './Text';
import { TOAST_TYPE, useToasts } from './ToastProvider';
import UploadedFilePreview from './UploadedFilePreview';

const Dropzone = styled(Container)`
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
      border-color: ${props.theme.colors.red[500]};
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

/** Fets the average progress from a list of upload progress */
const getUploadProgress = uploadProgressList => {
  if (!uploadProgressList || uploadProgressList.length === 0) {
    return 0;
  } else {
    const totalUploadProgress = uploadProgressList.reduce((total, current) => total + current, 0);
    return Math.trunc(totalUploadProgress / uploadProgressList.length);
  }
};

/**
 * A dropzone to upload one or multiple files
 */
const StyledDropzone = ({
  onSuccess,
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
  ...props
}) => {
  const [isUploading, setUploading] = React.useState(false);
  const [uploadProgressList, setUploadProgressList] = React.useState([]);
  const uploadProgress = getUploadProgress(uploadProgressList);
  const { addToast } = useToasts();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    minSize,
    maxSize,
    multiple: isMulti,
    onDrop: React.useCallback(
      async (acceptedFiles, rejectedFiles) => {
        setUploading(true);
        const filesToUpload = isMulti ? acceptedFiles : [acceptedFiles[0]];
        const results = await allSettled(
          filesToUpload.map((file, index) =>
            uploadImageWithXHR(file, {
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

        const [successes, failures] = partition(results, r => r.status === 'fulfilled');
        const getResultValue = r => r.value;
        const getRejectReason = r => getErrorFromXhrUpload(r.reason);

        if (onSuccess && successes.length > 0) {
          await onSuccess(isMulti ? successes.map(getResultValue) : getResultValue(successes[0]));
        }

        if (onReject && failures.length > 0) {
          onReject(isMulti ? failures.map(getRejectReason) : getRejectReason(failures[0]));
        }

        if (rejectedFiles?.length) {
          addToast({
            type: TOAST_TYPE.ERROR,
            message: (
              <React.Fragment>
                <FormattedMessage
                  id="StyledDropzone."
                  defaultMessage="The following {count, plural, one {file is} other {files are}} not valid: {files}"
                  values={{
                    count: rejectedFiles.length,
                    files: <i>{rejectedFiles.map(({ file }) => file.name).join(', ')}</i>,
                  }}
                />
                . {get(rejectedFiles[0], 'errors.0.message') || null}
              </React.Fragment>
            ),
          });
        }
      },
      [isMulti, onSuccess, onReject, mockImageGenerator, uploadProgressList],
    ),
  });

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
                <P color="black.500" px={2} fontSize={fontSize}>
                  {isMulti ? (
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
                  <UploadedFilePreview size={size} url={value} hasLink border="none" />
                  <ReplaceContainer
                    onClick={dropProps.onClick}
                    role="button"
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        dropProps.onClick();
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

StyledDropzone.propTypes = {
  /** Called back with the uploaded files on success */
  onSuccess: PropTypes.func,
  /** Name for the input */
  name: PropTypes.string,
  /** Called back with the rejectd files */
  onReject: PropTypes.func,
  /** Content to show inside the dropzone. Defaults to message "Drag and drop one or..." */
  children: PropTypes.node,
  /** Force loading state to be displayed */
  isLoading: PropTypes.bool,
  /** Use this to override the loading progress indicator */
  loadingProgress: PropTypes.number,
  /** Font size used for the default messages */
  fontSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Min height of the container */
  minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** To have square container */
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** A function to generate mock images */
  mockImageGenerator: PropTypes.func,
  /** Wether the dropzone should accept multiple files */
  isMulti: PropTypes.bool,
  /** Filetypes to accept */
  accept: PropTypes.string,
  /** Min file size */
  minSize: PropTypes.number,
  /** Max file size */
  maxSize: PropTypes.number,
  /** A truthy/falsy value defining if the field has an error (ie. if it's required) */
  error: PropTypes.any,
  /** required field */
  required: PropTypes.bool,
  /** if set, the image will be displayed and a "replace" banner will be added */
  value: PropTypes.string,
};

StyledDropzone.defaultProps = {
  minHeight: 96,
  mockImageGenerator: () => `https://loremflickr.com/120/120?lock=${uuid()}`,
  isMulti: true,
  fontSize: '14px',
};

export default StyledDropzone;

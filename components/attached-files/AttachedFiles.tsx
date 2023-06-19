import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { getDefaultFileName } from '../../lib/expenses';
import { FileInfo } from '../../lib/graphql/types/v2/graphql';

import { Box, Flex } from '../Grid';
import LocalFilePreview from '../LocalFilePreview';
import StyledLinkButton from '../StyledLinkButton';
import UploadedFilePreview from '../UploadedFilePreview';

type AttachedFilesProps = {
  files: Array<File | FileInfo>;
  onRemove?: (idx: number) => void;
  openFileViewer?: (idx: number) => void;
};

const AttachedFiles = ({ files, onRemove, openFileViewer }: AttachedFilesProps) => {
  const intl = useIntl();
  return (
    <Flex flexWrap="wrap">
      {files?.map((file, idx) => (
        <Box key={file['id'] || file['url'] || `local-file-${idx}`} mr={3} mb={3}>
          {file instanceof File ? (
            <LocalFilePreview size={88} file={file} />
          ) : (
            <UploadedFilePreview
              size={88}
              url={file.url}
              fileName={file.name || getDefaultFileName(intl, idx, files.length)}
              fileSize={file.size}
              showFileName
              openFileViewer={openFileViewer}
            />
          )}
          {onRemove && (
            <Box ml="4px" mt="2px">
              <StyledLinkButton variant="danger" fontSize="12px" onClick={() => onRemove(idx)}>
                <FormattedMessage id="Remove" defaultMessage="Remove" />
              </StyledLinkButton>
            </Box>
          )}
        </Box>
      ))}
    </Flex>
  );
};

export default AttachedFiles;

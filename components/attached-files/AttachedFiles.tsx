import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { getDefaultFileName } from '../../lib/expenses';
import type { FileInfo } from '../../lib/graphql/types/v2/graphql';

import { Box, Flex } from '../Grid';
import LocalFilePreview from '../LocalFilePreview';
import StyledLinkButton from '../StyledLinkButton';
import UploadedFilePreview from '../UploadedFilePreview';

type AttachedFilesProps = {
  files: Array<File | FileInfo>;
  onRemove?: (idx: number) => void;
  openFileViewer?: (url: string) => void;
  size?: number;
};

const AttachedFiles = ({ files, onRemove, openFileViewer, size = 88 }: AttachedFilesProps) => {
  const intl = useIntl();
  return (
    <Flex flexWrap="wrap" gridGap="16px">
      {files?.map((file, idx) => (
        <Box key={file['id'] || file['url'] || `local-file-${idx}`}>
          {file instanceof File ? (
            <LocalFilePreview size={88} file={file} />
          ) : (
            <UploadedFilePreview
              size={size}
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

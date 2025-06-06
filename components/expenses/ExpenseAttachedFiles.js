import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { getDefaultFileName } from '../../lib/expenses';

import { Box, Flex } from '../Grid';
import LocalFilePreview from '../LocalFilePreview';
import StyledLinkButton from '../StyledLinkButton';
import UploadedFilePreview from '../UploadedFilePreview';

const ExpenseAttachedFiles = ({ files, onRemove, openFileViewer = undefined }) => {
  const intl = useIntl();

  return (
    <Flex flexWrap="wrap">
      {files?.map((file, idx) => {
        const isUploadedFile = !!file.url;

        const preview = isUploadedFile ? (
          <UploadedFilePreview
            size={88}
            url={file.url}
            fileName={file.name || getDefaultFileName(intl, idx, files.length)}
            fileSize={file.info?.size}
            showFileName
            openFileViewer={openFileViewer}
            data-cy="download-expense-invoice-btn"
          />
        ) : (
          <LocalFilePreview size={88} file={file} />
        );

        return (
          <Box key={file.id || file.url || file.name} mr={3} mb={3}>
            {preview}
            {onRemove && (
              <Box ml="4px" mt="2px">
                <StyledLinkButton variant="danger" fontSize="12px" onClick={() => onRemove(idx)}>
                  <FormattedMessage id="Remove" defaultMessage="Remove" />
                </StyledLinkButton>
              </Box>
            )}
          </Box>
        );
      })}
    </Flex>
  );
};

export default ExpenseAttachedFiles;

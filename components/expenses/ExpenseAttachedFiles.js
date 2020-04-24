import { Box, Flex } from '../Grid';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import StyledButton from '../StyledButton';
import UploadedFilePreview from '../UploadedFilePreview';

const ExpenseAttachedFiles = ({ files, onRemove }) => {
  return (
    <Flex flexWrap="wrap">
      {files.map((file, idx) => (
        <Box key={file.id || file.url} mr={3}>
          <UploadedFilePreview size={88} url={file.url}>
            <img src={file.url} alt={`Attachment ${idx}`} />
          </UploadedFilePreview>
          {onRemove && (
            <StyledButton
              isBorderless
              buttonStyle="dangerSecondary"
              buttonSize="tiny"
              mt={1}
              onClick={() => onRemove(idx)}
            >
              <FormattedMessage id="Remove" defaultMessage="Remove" />
            </StyledButton>
          )}
        </Box>
      ))}
    </Flex>
  );
};

ExpenseAttachedFiles.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      url: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  /** If provided, a link to remove the file will be displayed */
  onRemove: PropTypes.func,
};

export default ExpenseAttachedFiles;

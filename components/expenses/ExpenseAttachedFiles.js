import { Box, Flex } from '@rebass/grid';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import ExternalLink from '../ExternalLink';
import StyledButton from '../StyledButton';

const ImageLink = styled(ExternalLink).attrs({ openInNewTab: true })`
  border: 1px solid #dcdee0;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  overflow: hidden;
  width: 88px;
  height: 88px;
  display: block;
  margin-right: 16px;

  img {
    width: 100%;
    height: 100%;
    max-height: 100%;
    max-width: 100%;
  }
`;

const ExpenseAttachedFiles = ({ files, onRemove }) => {
  return (
    <Flex flexWrap="wrap">
      {files.map((file, idx) => (
        <Box key={file.id}>
          <ImageLink href={file.url}>
            <img src={file.url} alt={`Attachment ${idx}`} />
          </ImageLink>
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
      id: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  /** If provided, a link to remove the file will be displayed */
  onRemove: PropTypes.func,
};

export default ExpenseAttachedFiles;

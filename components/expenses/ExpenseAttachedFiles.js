import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import expenseTypes from '../../lib/constants/expenseTypes';

import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import UploadedFilePreview from '../UploadedFilePreview';

import ExpenseInvoiceDownloadHelper, { getExpenseInvoiceFilename } from './ExpenseInvoiceDownloadHelper';

const ExpenseAttachedFiles = ({ files, onRemove, showInvoice, collective, expense }) => {
  return (
    <Flex flexWrap="wrap">
      {showInvoice && expense.type === expenseTypes.INVOICE && (
        <Box mr={3}>
          <ExpenseInvoiceDownloadHelper expense={expense} collective={collective}>
            {({ isLoading, downloadInvoice }) => (
              <UploadedFilePreview
                onClick={downloadInvoice}
                isDownloading={isLoading}
                title={getExpenseInvoiceFilename(collective, expense)}
                size={88}
              />
            )}
          </ExpenseInvoiceDownloadHelper>
        </Box>
      )}
      {files.map((file, idx) => (
        <Box key={file.id || file.url} mr={3}>
          <UploadedFilePreview size={88} url={file.url} />
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
  showInvoice: PropTypes.bool,
  /** Required if showInvoice is true */
  expense: PropTypes.object,
  /** Required if showInvoice is true */
  collective: PropTypes.object,
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

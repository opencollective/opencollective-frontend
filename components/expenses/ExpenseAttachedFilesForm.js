import React from 'react';
import PropTypes from 'prop-types';
import { uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { attachmentDropzoneParams } from './lib/attachments';

import { Box } from '../Grid';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import StyledDropzone from '../StyledDropzone';
import StyledInputField from '../StyledInputField';
import { Span } from '../Text';

import ExpenseAttachedFiles from './ExpenseAttachedFiles';

const PrivateNoteLabel = () => {
  return (
    <Span color="black.700">
      <FormattedMessage id="Expense.Attachments" defaultMessage="Attachments" />
      &nbsp;&nbsp;
      <PrivateInfoIcon color="#969BA3" />
    </Span>
  );
};

const ExpenseAttachedFilesForm = ({ onChange, disabled, defaultValue }) => {
  const [files, setFiles] = React.useState(uniqBy(defaultValue, 'url'));

  return (
    <StyledInputField
      name="attachedFiles"
      required={false}
      maxWidth={782}
      label={<PrivateNoteLabel />}
      labelProps={{ fontWeight: '500', fontSize: 'LeadCaption' }}
    >
      {inputProps => (
        <div>
          {files?.length > 0 && (
            <Box mb={2}>
              <ExpenseAttachedFiles
                files={files}
                onRemove={idx => {
                  const updatedFiles = [...files];
                  updatedFiles.splice(idx, 1);
                  setFiles(updatedFiles);
                  onChange(updatedFiles);
                }}
              />
            </Box>
          )}
          <StyledDropzone
            {...inputProps}
            {...attachmentDropzoneParams}
            isMulti
            disabled={disabled}
            minHeight={72}
            onSuccess={urls => {
              const newFiles = urls.map(url => ({ url }));
              const updatedFiles = uniqBy([...files, ...newFiles], 'url');
              setFiles(updatedFiles);
              onChange(updatedFiles);
            }}
          />
        </div>
      )}
    </StyledInputField>
  );
};

ExpenseAttachedFilesForm.propTypes = {
  defaultValue: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
    }),
  ),
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
};

export default ExpenseAttachedFilesForm;

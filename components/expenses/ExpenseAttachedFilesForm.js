import React from 'react';
import PropTypes from 'prop-types';
import { uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { attachmentDropzoneParams } from './lib/attachments';

import { Flex } from '../Grid';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import StyledDropzone from '../StyledDropzone';
import StyledHr from '../StyledHr';
import { P, Span } from '../Text';

import ExpenseAttachedFiles from './ExpenseAttachedFiles';

const ExpenseAttachedFilesForm = ({ onChange, disabled, defaultValue }) => {
  const [files, setFiles] = React.useState(uniqBy(defaultValue, 'url'));

  return (
    <div>
      <Flex alignItems="center" my={16}>
        <Span color="black.600" fontSize="LeadParagraph" lineHeight="LeadCaption">
          <FormattedMessage
            id="OptionalFieldLabel"
            defaultMessage="{field} (optional)"
            values={{
              field: (
                <Span color="black.900" fontWeight="bold">
                  <FormattedMessage id="UploadInvoice" defaultMessage="Upload invoice" />
                </Span>
              ),
            }}
          />
          &nbsp;
          <PrivateInfoIcon color="#969BA3" size={12} />
        </Span>
        <StyledHr flex="1" borderColor="black.300" mx={2} />
      </Flex>
      <P fontSize="13px" color="black.600" mb={16}>
        <FormattedMessage
          id="UploadInvoiceDescription"
          defaultMessage="If you already have an invoice upload it here."
        />
      </P>
      {files?.length > 0 ? (
        <ExpenseAttachedFiles
          files={files}
          onRemove={idx => {
            const updatedFiles = [...files];
            updatedFiles.splice(idx, 1);
            setFiles(updatedFiles);
            onChange(updatedFiles);
          }}
        />
      ) : (
        <StyledDropzone
          {...attachmentDropzoneParams}
          name="attachedFiles"
          isMulti={false}
          disabled={disabled}
          minHeight={72}
          onSuccess={url => {
            const newFile = { url };
            setFiles([newFile]);
            onChange([newFile]);
          }}
        />
      )}
    </div>
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

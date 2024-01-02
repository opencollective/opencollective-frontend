import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { Box } from '../Grid';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import RichTextEditor from '../RichTextEditor';
import StyledInputField from '../StyledInputField';
import { Span } from '../Text';

const msg = defineMessages({
  notesPlaceholder: {
    id: 'ExpenseSummary.addNotesLabel',
    defaultMessage: 'Add notes',
  },
});

const PrivateNoteLabel = () => {
  return (
    <Span color="black.700">
      <FormattedMessage id="ExpenseSummary.addNotesLabel" defaultMessage="Add notes" />
      &nbsp;&nbsp;
      <PrivateInfoIcon />
    </Span>
  );
};

const ExpenseNotesForm = ({ onChange, disabled, defaultValue, hideLabel }) => {
  const { formatMessage } = useIntl();
  return (
    <StyledInputField
      htmlFor="expense-privateMessage-input"
      name="privateMessage"
      required={false}
      label={hideLabel ? null : <PrivateNoteLabel />}
      labelProps={{ fontWeight: '500', fontSize: '13px' }}
    >
      {inputProps => (
        <Box mt={2}>
          <RichTextEditor
            withBorders
            version="simplified"
            id={inputProps.id}
            inputName={inputProps.name}
            placeholder={formatMessage(msg.notesPlaceholder)}
            minHeight={72}
            onChange={onChange}
            disabled={disabled}
            defaultValue={defaultValue}
            fontSize="13px"
            data-cy="ExpenseNotesEditor"
          />
        </Box>
      )}
    </StyledInputField>
  );
};

ExpenseNotesForm.propTypes = {
  defaultValue: PropTypes.string,
  disabled: PropTypes.bool,
  hideLabel: PropTypes.bool,
  onChange: PropTypes.func,
};

export default ExpenseNotesForm;

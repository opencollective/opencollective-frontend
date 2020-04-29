import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import StyledInputField from '../StyledInputField';
import StyledTextarea from '../StyledTextarea';
import { Span } from '../Text';

const msg = defineMessages({
  notesPlaceholder: {
    id: 'ExpenseSummary.addNotesPlaceholder',
    defaultMessage: 'Add notes',
  },
});

const PrivateNoteLabel = () => {
  return (
    <Span color="black.700">
      <FormattedMessage id="ExpenseSummary.addNotesLabel" defaultMessage="Add notes" />
      &nbsp;&nbsp;
      <PrivateInfoIcon color="#969BA3" />
    </Span>
  );
};

const ExpenseNotesForm = ({ onChange, disabled, defaultValue }) => {
  const { formatMessage } = useIntl();
  return (
    <StyledInputField
      name="privateMessage"
      required={false}
      maxWidth={782}
      label={<PrivateNoteLabel />}
      labelProps={{ fontWeight: '500', fontSize: 'LeadCaption' }}
    >
      {inputProps => (
        <StyledTextarea
          {...inputProps}
          placeholder={formatMessage(msg.notesPlaceholder)}
          minHeight={72}
          onChange={onChange}
          disabled={disabled}
          defaultValue={defaultValue}
        />
      )}
    </StyledInputField>
  );
};

ExpenseNotesForm.propTypes = {
  defaultValue: PropTypes.string,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
};

export default ExpenseNotesForm;

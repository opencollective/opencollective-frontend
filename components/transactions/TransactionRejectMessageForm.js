import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import StyledInputField from '../StyledInputField';
import StyledTextarea from '../StyledTextarea';
import { P } from '../Text';

const MESSAGE_MAX_LENGTH = 500;

const messages = defineMessages({
  rejectionReason: {
    id: 'RejectionReason',
    defaultMessage: 'Type your rejection reason here if you want.',
  },
});

const TransactionRejectMessageForm = ({ message, onChange }) => {
  const intl = useIntl();
  const dispatchChange = e => {
    onChange(e.target.value);
  };
  return (
    <div>
      <StyledInputField
        autoFocus
        name="rejectionMessage"
        htmlFor="rejectionMessage"
        label={<FormattedMessage id="Contact.Message" defaultMessage="Message" />}
        my={3}
      >
        {inputProps => (
          <StyledTextarea
            {...inputProps}
            resize="none"
            withOutline
            maxLength={MESSAGE_MAX_LENGTH}
            minWidth={[290, 500]}
            minHeight={100}
            fontSize="14px"
            width="100%"
            placeholder={intl.formatMessage(messages.rejectionReason)}
            value={message}
            onChange={dispatchChange}
          />
        )}
      </StyledInputField>
      <P fontSize="11px">
        <FormattedMessage id="forms.optional" defaultMessage="Optional" />
      </P>
    </div>
  );
};

TransactionRejectMessageForm.propTypes = {
  message: PropTypes.object,
  onChange: PropTypes.func,
};

export default TransactionRejectMessageForm;

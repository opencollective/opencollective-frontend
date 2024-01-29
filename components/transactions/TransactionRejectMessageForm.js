import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
const MESSAGE_MAX_LENGTH = 500;

const messages = defineMessages({
  rejectionReason: {
    id: 'RejectionReason',
    defaultMessage: 'Type your rejection reason here if you want.',
  },
});

const TransactionRejectMessageForm = ({ message, onChange }) => {
  const intl = useIntl();
  return (
    <div className="space-y-2">
      <Label htmlFor="rejectionMessage">
        <FormattedMessage
          id="OptionalFieldLabel"
          defaultMessage="{field} (optional)"
          values={{ field: <FormattedMessage id="Contact.Message" defaultMessage="Message" /> }}
        />
      </Label>
      <Textarea
        resize="none"
        id="rejectionMessage"
        name="rejectionMessage"
        maxLength={MESSAGE_MAX_LENGTH}
        showCount
        placeholder={intl.formatMessage(messages.rejectionReason)}
        value={message}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
};

TransactionRejectMessageForm.propTypes = {
  message: PropTypes.string,
  onChange: PropTypes.func,
};

export default TransactionRejectMessageForm;

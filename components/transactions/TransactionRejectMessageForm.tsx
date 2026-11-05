import React from 'react';
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

type TransactionRejectMessageFormProps = {
  message: string;
  onChange: (message: string) => void;
};

const TransactionRejectMessageForm = ({ message, onChange }: TransactionRejectMessageFormProps) => {
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
        {...({ resize: 'none' } as Record<string, unknown>)}
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

export default TransactionRejectMessageForm;

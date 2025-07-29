import React from 'react';
import { FormattedMessage } from 'react-intl';

export function StripeVirtualCardComplianceStatement() {
  return (
    <p className="text-sm text-muted-foreground italic">
      <FormattedMessage
        defaultMessage="{virtualCardProgramName} Visa® Commercial Credit cards are issued by Celtic Bank."
        id="l+tve8"
        values={{
          virtualCardProgramName: 'Virtual Card',
        }}
      />
    </p>
  );
}

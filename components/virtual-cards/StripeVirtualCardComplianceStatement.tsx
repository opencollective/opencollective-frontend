import React from 'react';
import { FormattedMessage } from 'react-intl';

export function StripeVirtualCardComplianceStatement() {
  return (
    <p className="text-sm italic text-muted-foreground">
      <FormattedMessage
        defaultMessage="{virtualCardProgramName} Visa® Commercial Credit cards are issued by Celtic Bank."
        values={{
          virtualCardProgramName: 'Virtual Card',
        }}
      />
    </p>
  );
}

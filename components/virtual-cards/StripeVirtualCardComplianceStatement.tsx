import React from 'react';
import { FormattedMessage } from 'react-intl';

import { P } from '../Text';

export function StripeVirtualCardComplianceStatement() {
  return (
    <P fontStyle="italic" fontSize="14px">
      <FormattedMessage
        defaultMessage="{virtualCardProgramName} Visa® Commercial Credit cards are issued by Celtic Bank."
        values={{
          virtualCardProgramName: 'Virtual Card',
        }}
      />
    </P>
  );
}

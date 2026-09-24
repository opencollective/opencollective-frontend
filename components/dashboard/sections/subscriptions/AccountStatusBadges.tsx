import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Badge } from '../../../ui/Badge';

type AccountStatusBadgesProps = {
  account: {
    isFrozen?: boolean | null;
    platformSubscription?: { isAccountOnHold?: boolean | null } | null;
  };
};

export const AccountStatusBadges = ({ account }: AccountStatusBadgesProps) => {
  return (
    <React.Fragment>
      {account.isFrozen && (
        <Badge size="sm" type="info">
          <FormattedMessage defaultMessage="Frozen" id="CollectiveStatus.Frozen" />
        </Badge>
      )}
      {account.platformSubscription?.isAccountOnHold && (
        <Badge size="sm" type="error">
          <FormattedMessage defaultMessage="Blocked due to billing" id="jN20jX" />
        </Badge>
      )}
    </React.Fragment>
  );
};

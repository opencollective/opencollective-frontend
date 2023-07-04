import React from 'react';
import { FormattedMessage } from 'react-intl';

import { VirtualCardLimitInterval } from '../graphql/types/v2/graphql';

export const getLimitIntervalString = spendingLimitInterval => {
  switch (spendingLimitInterval) {
    case VirtualCardLimitInterval.DAILY:
      return (
        <React.Fragment>
          /<FormattedMessage id="Frequency.Day.Short" defaultMessage="day" />
        </React.Fragment>
      );
    case VirtualCardLimitInterval.WEEKLY:
      return (
        <React.Fragment>
          /<FormattedMessage id="Frequency.Week.Short" defaultMessage="wk" />
        </React.Fragment>
      );
    case VirtualCardLimitInterval.MONTHLY:
      return (
        <React.Fragment>
          /<FormattedMessage id="Frequency.Monthly.Short" defaultMessage="mo" />
        </React.Fragment>
      );
    case VirtualCardLimitInterval.YEARLY:
      return (
        <React.Fragment>
          /<FormattedMessage id="Frequency.Yearly.Short" defaultMessage="yr" />
        </React.Fragment>
      );
    default:
      return null;
  }
};

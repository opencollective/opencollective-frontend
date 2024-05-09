import React from 'react';
import { FormattedMessage } from 'react-intl';

export enum UPDATE_NOTIFICATION_AUDIENCE {
  ALL = 'ALL',
  COLLECTIVE_ADMINS = 'COLLECTIVE_ADMINS',
  FINANCIAL_CONTRIBUTORS = 'FINANCIAL_CONTRIBUTORS',
  NO_ONE = 'NO_ONE',
}

export const UpdateNotificationAudienceLabels = {
  ALL: <FormattedMessage id="Update.notify.everyone" defaultMessage="Everyone" />,
  COLLECTIVE_ADMINS: (
    <FormattedMessage id="Update.notify.hostedCollectiveAdmins" defaultMessage="Hosted collective's admins" />
  ),
  FINANCIAL_CONTRIBUTORS: (
    <FormattedMessage id="ContributorsFilter.Financial" defaultMessage="Financial contributors" />
  ),
  NO_ONE: <FormattedMessage id="tcxpLX" defaultMessage="No one" />,
};

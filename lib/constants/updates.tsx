import React from 'react';
import { FormattedMessage } from 'react-intl';

export enum UPDATE_NOTIFICATION_AUDIENCE {
  ALL = 'ALL',
  COLLECTIVE_ADMINS = 'COLLECTIVE_ADMINS',
  FINANCIAL_CONTRIBUTORS = 'FINANCIAL_CONTRIBUTORS',
  NO_ONE = 'NO_ONE',
}

export const UpdateNotificationAudienceLabels = {
  ALL: <FormattedMessage id="Update.notify.all" defaultMessage="Collective Admins & Contributors" />,
  COLLECTIVE_ADMINS: <FormattedMessage id="Update.notify.hostedCollectiveAdmins" defaultMessage="Collective Admins" />,
  FINANCIAL_CONTRIBUTORS: <FormattedMessage id="Contributors" defaultMessage="Contributors" />,
  NO_ONE: <FormattedMessage id="tcxpLX" defaultMessage="No one" />,
};

import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Activity } from '../../../../lib/graphql/types/v2/graphql';

import Avatar from '../../../Avatar';

const Username = ({ individual, avatarSize }) => {
  return !individual ? (
    <span>
      <FormattedMessage id="user.Unknown" defaultMessage="Unknown" />
    </span>
  ) : (
    <div className="flex items-center gap-2">
      <Avatar radius={avatarSize} collective={individual} />
      {individual.name}
    </div>
  );
};

export const ActivityUser = ({
  activity,
  showBy = false,
  avatarSize = 24,
}: {
  activity: Activity;
  showBy?: boolean;
  avatarSize?: number;
}) => {
  return activity.isSystem ? (
    <span>
      <FormattedMessage defaultMessage="System Activity" />
    </span>
  ) : showBy ? (
    <FormattedMessage
      id="ByUser"
      defaultMessage="By {userName}"
      values={{ userName: <Username individual={activity.individual} avatarSize={avatarSize} /> }}
    />
  ) : (
    <Username individual={activity.individual} avatarSize={avatarSize} />
  );
};

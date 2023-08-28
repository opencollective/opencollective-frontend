import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Activity } from '../../../../lib/graphql/types/v2/graphql';

import Avatar from '../../../Avatar';
import { Flex } from '../../../Grid';
import LinkCollective from '../../../LinkCollective';
import StyledLink from '../../../StyledLink';
import { Span } from '../../../Text';

const Username = ({ individual, avatarSize }) => {
  return !individual ? (
    <Span>
      <FormattedMessage id="user.Unknown" defaultMessage="Unknown" />
    </Span>
  ) : (
    <StyledLink as={LinkCollective} color="black.700" collective={individual}>
      <Flex alignItems="center" gridGap="8px">
        <Avatar radius={avatarSize} collective={individual} />
        {individual.name}
      </Flex>
    </StyledLink>
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
    <Span>
      <FormattedMessage defaultMessage="System Activity" />
    </Span>
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

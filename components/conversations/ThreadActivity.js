import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { useTheme } from 'styled-components';

import Avatar from '../Avatar';
import DateTime from '../DateTime';
import { Box as Container, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import StyledLink from '../StyledLink';
import { Span } from '../Text';

import { ACTIVITIES_INFO, getActivityColors } from './activity-helpers';

const ActivityParagraph = styled(Container)`
  padding: 10px 12px;
  border-left: 4px solid ${props => props.activityColor};
  border-radius: 0;
`;

const ActivityMessage = styled.span`
  font-size: 10px;
  font-weight: 600;
  background: white;
  color: ${props => props.color};
`;

const ThreadActivity = ({ activity }) => {
  const intl = useIntl();
  const theme = useTheme();
  const activityColors = getActivityColors(activity.type, theme);
  const message = ACTIVITIES_INFO[activity.type]?.message;
  const details =
    ACTIVITIES_INFO[activity.type]?.renderDetails?.(activity.data) ||
    activity.data?.message ||
    activity.data?.error?.message;
  const DataRenderer = ACTIVITIES_INFO[activity.type]?.DataRenderer;

  return (
    <div>
      {activity.individual && (
        <Flex>
          <LinkCollective collective={activity.individual}>
            <Avatar radius={40} collective={activity.individual} />
          </LinkCollective>
          <Flex flexDirection="column" justifyContent="center" ml={3}>
            <div className="mb-1 text-sm text-muted-foreground">
              <FormattedMessage
                id="ByUser"
                defaultMessage="By {userName}"
                values={{
                  userName: (
                    <StyledLink
                      key="link"
                      as={LinkCollective}
                      color="black.800"
                      collective={activity.individual}
                      withHoverCard
                      hoverCardProps={{
                        hoverCardContentProps: { side: 'top' },
                        includeAdminMembership: {
                          accountSlug: activity.account?.slug,
                          hostSlug: activity.account?.host?.slug,
                        },
                      }}
                    />
                  ),
                }}
              />
            </div>
            <Span color="#4b5563" fontSize="12px">
              <FormattedMessage
                defaultMessage="on {date}"
                id="mzGohi"
                values={{ date: <DateTime key="date" value={activity.createdAt} /> }}
              />
            </Span>
          </Flex>
        </Flex>
      )}
      {message && (
        <ActivityParagraph activityColor={activityColors.border} my={1} fontSize="12px" whiteSpace="pre-line">
          <ActivityMessage color={activityColors.text}>
            {intl.formatMessage(message, {
              movedFromCollective: activity.data?.movedFromCollective?.name || 'collective',
            })}
          </ActivityMessage>
          {details && <div className="mt-2 text-xs">{details}</div>}
          {DataRenderer && <DataRenderer activity={activity} />}
        </ActivityParagraph>
      )}
    </div>
  );
};

export default ThreadActivity;

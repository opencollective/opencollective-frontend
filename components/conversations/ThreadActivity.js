import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
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
            <Span color="black.600">
              <FormattedMessage
                id="ByUser"
                defaultMessage="By {userName}"
                values={{
                  userName: (
                    <StyledLink
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
            </Span>
            <Span color="black.600" fontSize="12px">
              <FormattedMessage
                defaultMessage="on {date}"
                id="mzGohi"
                values={{ date: <DateTime value={activity.createdAt} /> }}
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
          {details && (
            <Fragment>
              <br />
              {details}
            </Fragment>
          )}
          {DataRenderer && <DataRenderer activity={activity} />}
        </ActivityParagraph>
      )}
    </div>
  );
};

ThreadActivity.propTypes = {
  activity: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(Object.keys(ACTIVITIES_INFO)).isRequired,
    createdAt: PropTypes.string.isRequired,
    data: PropTypes.shape({
      error: PropTypes.shape({
        message: PropTypes.string,
      }),
      message: PropTypes.string,
      movedFromCollective: PropTypes.object,
    }),
    individual: PropTypes.shape({
      id: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
    account: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      host: PropTypes.shape({
        slug: PropTypes.string.isRequired,
      }),
    }),
  }),
};

export default ThreadActivity;

import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import { Box, Flex } from '../../../Grid';
import LinkCollective from '../../../LinkCollective';
import StyledButton from '../../../StyledButton';
import StyledLink from '../../../StyledLink';
import { P, Span } from '../../../Text';

import ActivityDescription from './ActivityDescription';
import { DETAILED_ACTIVITY_TYPES } from './ActivityDetails';

const MetadataContainer = styled.div`
  display: flex;
  align-items: center;
  grid-gap: 8px;
  color: #4d4f51;
  margin-top: 10px;
  a {
    color: #4d4f51;
    text-decoration: none;
    &:hover {
      color: #4e5052;
    }
  }
`;

const ActivityListItem = ({ activity }) => {
  return (
    <Box px="16px" py="14px">
      <P color="black.900" fontWeight="500" fontSize="14px">
        <ActivityDescription activity={activity} />
      </P>
      <MetadataContainer>
        {activity.isSystem ? (
          <Span>
            <FormattedMessage defaultMessage="System Activity" />
          </Span>
        ) : (
          <FormattedMessage
            id="ByUser"
            defaultMessage="By {userName}"
            values={{
              userName: !activity.individual ? (
                <Span>
                  <FormattedMessage id="user.unknown" defaultMessage="Unknown" />
                </Span>
              ) : (
                <StyledLink as={LinkCollective} color="black.700" collective={activity.individual}>
                  <Flex alignItems="center" gridGap="8px">
                    <Avatar radius={24} collective={activity.individual} />
                    {activity.individual.name}
                  </Flex>
                </StyledLink>
              ),
            }}
          />
        )}
        •
        <DateTime value={activity.createdAt} dateStyle="medium" />
        {DETAILED_ACTIVITY_TYPES.includes(activity.type) && (
          <StyledButton>
            <FormattedMessage id="viewDetails" defaultMessage="View Details" />
          </StyledButton>
        )}
      </MetadataContainer>
    </Box>
  );
};

ActivityListItem.propTypes = {
  activity: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    individual: PropTypes.shape({ name: PropTypes.string }),
    isSystem: PropTypes.bool,
  }).isRequired,
};

export default ActivityListItem;

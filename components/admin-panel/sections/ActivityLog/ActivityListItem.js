import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/feather/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp';
import { themeGet } from '@styled-system/theme-get';
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
import ActivityDetails, { DETAILED_ACTIVITY_TYPES } from './ActivityDetails';

const MetadataContainer = styled.div`
  display: flex;
  align-items: center;
  grid-gap: 8px;
  color: #4d4f51;
  a {
    color: #4d4f51;
    text-decoration: none;
    &:hover {
      color: #4e5052;
    }
  }
`;

const DetailsContainer = styled.div`
  width: 100%;
  padding: 16px;
  background: ${themeGet('colors.black.800')};
  box-shadow: 0px 0px 6px 4px #1e1e1e inset;
  color: white;
  margin-top: 16px;
  font-size: 12px;
  border-radius: 4px;
`;

const ActivityListItem = ({ activity }) => {
  const [showDetails, setShowDetails] = React.useState(false);
  return (
    <Box px="16px" py="14px">
      <P color="black.900" fontWeight="500" fontSize="14px">
        <ActivityDescription activity={activity} />
      </P>
      <Flex justifyContent="space-between" alignItems="center" mt="10px">
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
                    <FormattedMessage id="user.Unknown" defaultMessage="Unknown" />
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
        </MetadataContainer>
        {DETAILED_ACTIVITY_TYPES.includes(activity.type) && (
          <StyledButton
            ml={12}
            isBorderless
            buttonStyle="secondary"
            buttonSize="tiny"
            onClick={() => setShowDetails(!showDetails)}
          >
            {!showDetails ? (
              <FormattedMessage defaultMessage="Show Details" />
            ) : (
              <FormattedMessage defaultMessage="Hide Details" />
            )}
            <Span ml={1}>
              {showDetails ? <ChevronUp size="1em" strokeWidth="3px" /> : <ChevronDown size="1em" strokeWidth="3px" />}
            </Span>
          </StyledButton>
        )}
      </Flex>
      {showDetails && (
        <DetailsContainer>
          <ActivityDetails activity={activity} />
        </DetailsContainer>
      )}
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

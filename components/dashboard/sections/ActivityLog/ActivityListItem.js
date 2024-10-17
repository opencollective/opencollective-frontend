import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import DateTime from '../../../DateTime';
import { Box, Flex } from '../../../Grid';

import ActivityDescription from './ActivityDescription';
import { ActivityUser } from './ActivityUser';

const MetadataContainer = styled.div`
  font-size: 13px;
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

const DescriptionContainer = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme.colors.black[900]};
  white-space: normal;
`;

const ActivityListItem = ({ activity }) => {
  return (
    <Box px="16px" py="14px">
      <DescriptionContainer>
        <ActivityDescription activity={activity} />
      </DescriptionContainer>
      <Flex justifyContent="space-between" alignItems="center" mt="8px">
        <MetadataContainer>
          <ActivityUser activity={activity} showBy />
          •
          <DateTime value={activity.createdAt} dateStyle="medium" />
        </MetadataContainer>
      </Flex>
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

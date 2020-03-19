import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';

import Avatar from '../../components/Avatar';
import StyledTag from '../../components/StyledTag';

const Admin = styled(StyledTag)`
  font-size: 14px;
  border-top-right-radius: 50px;
  border-bottom-right-radius: 50px;
`;

class OnboardingProfileCard extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
  };

  render() {
    const { collective } = this.props;
    const { name } = collective;

    return (
      <Flex my={1} ml={2}>
        <Admin textTransform="none">
          <Flex alignItems="center">
            <Avatar radius={15} collective={collective} />
            <Box fontSize="Caption" ml={2}>
              {name}
            </Box>
          </Flex>
        </Admin>
      </Flex>
    );
  }
}

export default OnboardingProfileCard;

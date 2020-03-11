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
    user: PropTypes.object,
    adminUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { user } = this.props;
    const { imageUrl, name, type } = user;

    return (
      <Flex my={1} ml={2}>
        <Admin textTransform="none" type="dark">
          <Flex alignItems="center">
            <Avatar src={imageUrl ? imageUrl : null} radius={15} name={name} type={type} />
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

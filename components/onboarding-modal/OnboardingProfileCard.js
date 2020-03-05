import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';

import Container from '../../components/Container';
import { H1, P, Span } from '../../components/Text';
import Avatar from '../../components/Avatar';

class OnboardingProfileCard extends React.Component {
  static propTypes = {
    user: PropTypes.object,
    adminUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { user, adminUser } = this.props;
    const { id, imageUrl, name, slug, type } = user;

    return (
      <Flex my={1}>
        <Flex alignItems="center" justifyContent="center">
          <Avatar src={imageUrl ? imageUrl : null} radius={32} name={name} type={type} />
        </Flex>
        <Flex flexDirection="column" ml={3}>
          <P color="black.800">{name}</P>
          <P color="black.600">{adminUser.id === id ? 'You' : `@${slug}`}</P>
        </Flex>
      </Flex>
    );
  }
}

export default OnboardingProfileCard;

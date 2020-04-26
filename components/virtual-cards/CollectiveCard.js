import React from 'react';
import PropTypes from 'prop-types';
import { has } from 'lodash';

import Avatar from '../Avatar';
import Container from '../Container';
import { Flex } from '../Grid';
import LinkCollective from '../LinkCollective';

const CollectiveCard = ({ collective, children, size, avatarSize, p, ...props }) => {
  const hasCustomColor = has(collective, 'settings.collectivePage.primaryColor');
  return (
    <Container
      width={size}
      height={size}
      m="0 auto"
      p={p}
      textAlign="center"
      background="white"
      border="3px solid"
      borderColor={hasCustomColor ? 'primary.200' : '#a974c7'}
      borderRadius="50%"
      boxShadow="0 0 14px 3px rgba(0, 0, 0, 0.24) inset"
      {...props}
    >
      <Flex flexDirection="column" alignItems="center" justifyContent="center" height="100%">
        <LinkCollective collective={collective}>
          <Avatar collective={collective} radius={avatarSize} />
        </LinkCollective>
        {children}
      </Flex>
    </Container>
  );
};

CollectiveCard.propTypes = {
  collective: PropTypes.object,
  children: PropTypes.node,
  size: PropTypes.number,
  fontSize: PropTypes.string,
  p: PropTypes.number,
  avatarSize: PropTypes.number,
};

CollectiveCard.defaultProps = {
  size: 300,
  avatarSize: 75,
  p: 3,
};

export default CollectiveCard;

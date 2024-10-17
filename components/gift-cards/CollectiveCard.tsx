import React from 'react';
import { has } from 'lodash';
import type { ReactNode } from 'react';

import type { GraphQLV1Collective } from '../../lib/custom_typings/GraphQLV1Collective';

import Avatar from '../Avatar';
import Container from '../Container';
import { Flex } from '../Grid';
import LinkCollective from '../LinkCollective';

type CollectiveCardProps = {
  collective: GraphQLV1Collective;
  children?: ReactNode;
  size?: string | number | (string | number)[];
  fontSize?: string;
  p?: number;
  avatarSize?: string | number | (string | number)[];
} & React.ComponentProps<typeof Container>;

const CollectiveCard = ({
  collective,
  children,
  size = 300,
  avatarSize = 75,
  p = 3,
  ...props
}: CollectiveCardProps) => {
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

export default CollectiveCard;

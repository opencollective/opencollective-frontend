import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { FormattedMessage, FormattedDate } from 'react-intl';
import { truncate } from 'lodash';

import StyledCard from './StyledCard';
import LinkCollective from './LinkCollective';
import Container from './Container';
import { P } from './Text';
import Avatar from './Avatar';

/**
 * A card to show a user's membership.
 */
const StyledMembershipCard = ({ since, role, toCollective }) => {
  return (
    <StyledCard width={250} height={360} position="relative">
      <Container background="lightgrey" height={100} />
      <Container mt={-32} display="flex" justifyContent="center">
        <Container border="2px solid white" borderRadius="25%" backgroundColor="white.transparent.48">
          <Avatar collective={toCollective} radius={64} />
        </Container>
      </Container>
      <Flex flexDirection="column" justifyContent="space-between">
        <Container textAlign="center" p={3}>
          <LinkCollective collective={toCollective}>
            <P fontSize="LeadParagraph" fontWeight="bold" color="black.800">
              {toCollective.name}
            </P>
          </LinkCollective>
          <P fontSize="Caption" color="black.700" title={toCollective.description}>
            {truncate(toCollective.description, { length: 120 })}
          </P>
        </Container>
        <Container
          height={70}
          position="absolute"
          bottom={0}
          borderTop="1px solid #E6E8EB"
          textAlign="center"
          p={3}
          width={1}
        >
          <P>{role}</P>
          <P>
            <FormattedMessage
              id="SinceDate"
              defaultMessage="Since {date}"
              values={{ date: <FormattedDate value={since} month="long" year="numeric" /> }}
            />
          </P>
        </Container>
      </Flex>
    </StyledCard>
  );
};

StyledMembershipCard.propTypes = {
  role: PropTypes.string.isRequired,
  since: PropTypes.string.isRequired,
  toCollective: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    backgroundImage: PropTypes.string.isRequired,
  }),
};

export default StyledMembershipCard;

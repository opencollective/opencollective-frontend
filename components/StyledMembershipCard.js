import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { get, truncate } from 'lodash';

import StyledCard from './StyledCard';
import LinkCollective from './LinkCollective';
import Container from './Container';
import { P } from './Text';
import Avatar from './Avatar';
import I18nCollectiveTags from './I18nCollectiveTags';
import { getCollectiveMainTag } from '../lib/collective.lib';
import StyledTag from './StyledTag';

const getBackground = backgroundImage => {
  return backgroundImage
    ? `url(/static/images/collective-card-mask.png) bottom, url(${backgroundImage}) no-repeat, #1776E1`
    : 'url(/static/images/collective-card-mask.png) bottom, #1776E1';
};

/**
 * A card to show a user's membership.
 */
const StyledMembershipCard = ({ toCollective, ...props }) => {
  return (
    <StyledCard width={250} height={360} position="relative" {...props}>
      <Container
        style={{ background: getBackground(toCollective.backgroundImage) }}
        backgroundSize="cover"
        height={100}
        px={3}
        pt={26}
      >
        <Container border="2px solid white" borderRadius="25%" backgroundColor="white.full" width={68}>
          <Avatar collective={toCollective} radius={64} />
        </Container>
      </Container>
      <Flex flexDirection="column" justifyContent="space-between">
        <Container p={3}>
          <LinkCollective collective={toCollective}>
            <P fontSize="LeadParagraph" fontWeight="bold" color="black.800">
              {toCollective.name}
            </P>
          </LinkCollective>
          <StyledTag display="inline-block" my={2}>
            <I18nCollectiveTags tags={getCollectiveMainTag(get(toCollective, 'host.id'), toCollective.tags)} />
          </StyledTag>
          <P fontSize="Caption" color="black.700" title={toCollective.description}>
            {truncate(toCollective.description, { length: 240 })}
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
    description: PropTypes.string,
    backgroundImage: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    host: PropTypes.shape({
      id: PropTypes.number,
    }),
  }),
};

export default StyledMembershipCard;

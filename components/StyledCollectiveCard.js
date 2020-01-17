import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { get } from 'lodash';
import { injectIntl } from 'react-intl';

import { getCollectiveMainTag } from '../lib/collective.lib';
import StyledCard from './StyledCard';
import LinkCollective from './LinkCollective';
import Container from './Container';
import { P } from './Text';
import Avatar from './Avatar';
import I18nCollectiveTags from './I18nCollectiveTags';
import StyledTag from './StyledTag';

const getBackground = collective => {
  const backgroundImage = collective.backgroundImageUrl || get(collective, 'parentCollective.backgroundImageUrl');
  const primaryColor = get(collective.settings, 'collectivePage.primaryColor', '#1776E1');
  return backgroundImage
    ? `url(/static/images/collective-card-mask.svg) 0 0 / cover no-repeat, url(${backgroundImage}) 0 0 / cover no-repeat, ${primaryColor}`
    : `url(/static/images/collective-card-mask.svg) 0 0 / cover no-repeat, ${primaryColor}`;
};

/**
 * A card to show a collective that supports including a custom body.
 */
const StyledCollectiveCard = ({ collective, children, ...props }) => {
  return (
    <StyledCard {...props}>
      <Container style={{ background: getBackground(collective) }} backgroundSize="cover" height={100} px={3} pt={26}>
        <Container border="2px solid white" borderRadius="25%" backgroundColor="white.full" width={68}>
          <LinkCollective collective={collective}>
            <Avatar collective={collective} radius={64} />
          </LinkCollective>
        </Container>
      </Container>
      <Flex flexDirection="column" justifyContent="space-between" height={260}>
        <Container p={3}>
          <LinkCollective collective={collective}>
            <P fontSize="LeadParagraph" fontWeight="bold" color="black.800">
              {collective.name}
            </P>
          </LinkCollective>
          <StyledTag display="inline-block" my={2}>
            <I18nCollectiveTags
              tags={getCollectiveMainTag(get(collective, 'host.id'), collective.tags, collective.type)}
            />
          </StyledTag>
        </Container>
        {children}
      </Flex>
    </StyledCard>
  );
};

StyledCollectiveCard.propTypes = {
  /** Displayed below the top header of the card */
  children: PropTypes.node,
  /** The collective to display */
  collective: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    backgroundImageUrl: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    settings: PropTypes.object,
    host: PropTypes.shape({
      id: PropTypes.number,
    }),
    parentCollective: PropTypes.shape({
      backgroundImageUrl: PropTypes.string,
    }),
  }).isRequired,
};

export default injectIntl(StyledCollectiveCard);

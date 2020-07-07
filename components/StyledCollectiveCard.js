import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { injectIntl } from 'react-intl';

import { getCollectiveMainTag } from '../lib/collective.lib';

import Avatar from './Avatar';
import Container from './Container';
import { Flex } from './Grid';
import I18nCollectiveTags from './I18nCollectiveTags';
import LinkCollective from './LinkCollective';
import StyledCard from './StyledCard';
import StyledTag from './StyledTag';
import { P } from './Text';

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
const StyledCollectiveCard = ({ collective, tag, children, ...props }) => {
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
          {tag === undefined ? (
            <StyledTag display="inline-block" textTransform="uppercase" my={2}>
              <I18nCollectiveTags
                tags={getCollectiveMainTag(get(collective, 'host.id'), collective.tags, collective.type)}
              />
            </StyledTag>
          ) : (
            tag
          )}
        </Container>
        {children}
      </Flex>
    </StyledCard>
  );
};

StyledCollectiveCard.propTypes = {
  /** Displayed below the top header of the card */
  children: PropTypes.node,
  /** To replace the default tag. Set to `null` to hide tag */
  tag: PropTypes.node,
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

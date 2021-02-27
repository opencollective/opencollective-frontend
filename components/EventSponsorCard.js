import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { getCollectiveImage } from '../lib/image-utils';

import Container from './Container';
import { P } from './Text';

const EventSponsorCardContainer = styled.div`
  display: inline-block;
  cursor: pointer;
  width: 12rem;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(46, 77, 97, 0.2);
  text-align: center;
  padding-top: 2rem;
  margin: 1rem;
  background: white;
  &:hover {
    box-shadow: 0 1px 5px rgba(46, 77, 97, 0.4);
  }
`;

const CollectiveImage = styled.img`
  max-width: 10rem;
  max-height: 5rem;
  margin-bottom: 0.5rem;
`;

const EventSponsorCard = ({ sponsor }) => (
  <a href={`/${sponsor.slug}`}>
    <EventSponsorCardContainer>
      <CollectiveImage alt="Collective Logo" className="logo" src={getCollectiveImage(sponsor, { name: 'logo' })} />
      <P color="#7fadf2" fontSize="1.2rem" m={2}>
        {sponsor.name}
      </P>
      <Container padding="1rem 0.5rem" margin="0" minHeight="27px" borderTop="1px solid #dde1e4" overflow="hidden">
        <P
          fontSize="1rem"
          fontWeight="700"
          textTransform="uppercase"
          color="#75cc1f"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          letterSpacing="1.47px"
          marginBottom="0.3rem"
        >
          {get(sponsor, 'tier.name')}
        </P>
        <P fontSize="1rem" letterSpacing="0.05rem" opacity="0.5" m={2}>
          <FormattedMessage
            id="membership.since"
            defaultMessage="since {date}"
            values={{ date: <FormattedDate value={sponsor.createdAt} month="long" year="numeric" /> }}
          />
        </P>
      </Container>
    </EventSponsorCardContainer>
  </a>
);

EventSponsorCard.propTypes = {
  sponsor: PropTypes.object,
};

export default EventSponsorCard;

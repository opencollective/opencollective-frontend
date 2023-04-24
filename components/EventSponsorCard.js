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
  width: 120px;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(46, 77, 97, 0.2);
  text-align: center;
  padding-top: 20px;
  margin: 10px;
  background: white;
  &:hover {
    box-shadow: 0 1px 5px rgba(46, 77, 97, 0.4);
  }
`;

const CollectiveImage = styled.img`
  max-width: 100px;
  max-height: 50px;
  margin-bottom: 5px;
`;

const EventSponsorCard = ({ sponsor }) => (
  <a href={`/${sponsor.slug}`}>
    <EventSponsorCardContainer>
      <CollectiveImage alt="" className="logo" src={getCollectiveImage(sponsor, { name: 'logo' })} />
      <P color="#7fadf2" fontSize="12px" m={2}>
        {sponsor.name}
      </P>
      <Container padding="10px 5px" margin="0" minHeight="27px" borderTop="1px solid #dde1e4" overflow="hidden">
        <P
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
          color="#75cc1f"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          letterSpacing="1.47px"
          marginBottom="3px"
        >
          {get(sponsor, 'tier.name')}
        </P>
        <P fontSize="10px" letterSpacing="0.5px" opacity="0.5" m={2}>
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

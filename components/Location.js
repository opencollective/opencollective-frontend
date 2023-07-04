import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { isURL } from 'validator';

import Container from './Container';
import { Flex } from './Grid';
import Map from './Map';
import StyledLink from './StyledLink';
import { P } from './Text';

const LocationSection = styled.section`
  text-align: center;
`;

function Location({ location, showTitle }) {
  const { name, address, lat, long, country } = location || {};

  if (!location) {
    return null;
  }

  if (name === 'Online') {
    if (address && isURL(address)) {
      return (
        <Flex flexDirection="Column" alignItems="center">
          <P textAlign="center">
            <StyledLink openInNewTabNoFollow href={address}>
              {address}
            </StyledLink>
          </P>
        </Flex>
      );
    } else {
      return (
        <P textAlign="center">
          <FormattedMessage id="Location.online" defaultMessage="Online" />
        </P>
      );
    }
  } else if (!name && !address && !lat && !long && !country) {
    return null;
  }

  const openStreetMapLink =
    isNaN(lat) || isNaN(long)
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`
      : `https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${long}#map=16/${lat}/${long}`;

  return (
    <LocationSection id="location">
      <Container margin="30px 10px">
        {showTitle && <h1>Location</h1>}
        <Container font-size="1.05rem" margin="5px 0px">
          {name}
        </Container>
        <Container className="address" color="black.600">
          <StyledLink href={openStreetMapLink} openInNewTab>
            {[address, country].filter(Boolean).join(', ')}
          </StyledLink>
        </Container>
      </Container>
      {lat && long && (
        <div className="relative h-80 border">
          <Map lat={lat} long={long} />
        </div>
      )}
    </LocationSection>
  );
}

Location.propTypes = {
  location: PropTypes.object,
  showTitle: PropTypes.bool,
};

Location.defaultProps = {
  showTitle: true,
};

export default Location;

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Container from './Container';
import Map from './Map';
import StyledLink from './StyledLink';

const LocationSection = styled.section`
  text-align: center;
`;

class Location extends React.Component {
  static propTypes = {
    location: PropTypes.object,
    showTitle: PropTypes.bool,
  };

  static defaultProps = {
    showTitle: true,
  };

  render() {
    const { name, address, lat, long, country } = this.props.location;

    return (
      <LocationSection id="location">
        <Container margin="30px 10px">
          {this.props.showTitle && <h1>Location</h1>}
          <Container font-size="1.7rem" margin="5px 0px">
            {name}
          </Container>
          <Container className="address" color="black.600">
            <StyledLink
              href={`https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${long}#map=16/${lat}/${long}`}
              openInNewTab
            >
              {address}
              {country ? `, ${country}` : ''}
            </StyledLink>
          </Container>
        </Container>
        {lat && long && (
          <div className="map">
            <Map lat={lat} long={long} />
          </div>
        )}
      </LocationSection>
    );
  }
}

export default Location;

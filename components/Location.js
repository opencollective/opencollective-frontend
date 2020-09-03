import React from 'react';
import PropTypes from 'prop-types';
import { isURL } from 'validator';

import colors from '../lib/constants/colors';

import Map from './Map';
import StyledLink from './StyledLink';
import { P } from './Text';

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

    if (name === 'Online') {
      if (address && isURL(address)) {
        return (
          <P textAlign="center">
            <StyledLink openInNewTabNoFollow href={address}>
              {address}
            </StyledLink>
          </P>
        );
      } else {
        return null;
      }
    } else if (!name && !address && !lat && !long && !country) {
      return null;
    }

    return (
      <section id="location" className="location">
        <style jsx>
          {`
            .location {
              text-align: center;
            }
            .description {
              margin: 30px 10px;
            }
            .name {
              font-size: 1.7rem;
              margin: 5px 0px;
            }
          `}
        </style>
        <div className="description">
          {this.props.showTitle && <h1>Location</h1>}
          <div className="name">{name}</div>
          <div className="address" style={{ color: colors.darkgray }}>
            <StyledLink
              href={`https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${long}#map=16/${lat}/${long}`}
              openInNewTab
            >
              {address}
              {country ? `, ${country}` : ''}
            </StyledLink>
          </div>
        </div>
        {lat && long && (
          <div className="map">
            <Map lat={lat} long={long} />
          </div>
        )}
      </section>
    );
  }
}

export default Location;

import React from 'react';
import PropTypes from 'prop-types';
import Map from './Map';
import colors from '../lib/constants/colors';
import ExternalLink from './ExternalLink';
import MessageBox from '../components/MessageBox';
import { get } from 'lodash';

class Location extends React.Component {
  static propTypes = {
    location: PropTypes.object,
    showTitle: PropTypes.bool,
  };

  static defaultProps = {
    showTitle: true,
  };

  isGoogleMapsAvailable = () => window && get(window, 'google.maps.places.AutocompleteService');

  render() {
    const { name, address, lat, long, country } = this.props.location;

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
            <ExternalLink href={`https://maps.apple.com/?q=${lat},${long}`} openInNewTab>
              {address}
              {country ? `, ${country}` : ''}
            </ExternalLink>
          </div>
        </div>
        {lat && long && (
          <div className="map">
            <Map lat={lat} long={long} />
          </div>
        )}

        {!this.isGoogleMapsAvailable() && (
          <MessageBox withIcon type="warning" style={{ marginTop: -20 }}>
            Google Maps and the &quot;Location&quot; input are not properly functioning because Google Maps could not be
            loaded.
          </MessageBox>
        )}
      </section>
    );
  }
}

export default Location;

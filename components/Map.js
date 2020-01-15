import React from 'react';
import PropTypes from 'prop-types';
import ExternalLink from './ExternalLink';
import { FormattedMessage } from 'react-intl';

class Map extends React.Component {
  static propTypes = {
    lat: PropTypes.number,
    long: PropTypes.number,
    address: PropTypes.string,
  };

  onMapCreated(map) {
    map.setOptions({
      disableDefaultUI: false,
    });
  }

  makeBbox(long, lat, zoomValue) {
    return [long - zoomValue, lat - zoomValue, long + zoomValue, lat + zoomValue];
  }

  render() {
    const { lat, long } = this.props;
    const bbox = this.makeBbox(long, lat, 0.003);

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <iframe
          width={'100%'}
          height={'100%'}
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat}%2C${long}&layers=ND`}
        ></iframe>
        <br />

        <ExternalLink
          openInNewTab
          href={`https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${long}#map=16/${lat}/${long}`}
        >
          <FormattedMessage id="map.viewLarger" defaultMessage="View Larger Map" />
        </ExternalLink>
      </div>
    );
  }
}

export default Map;

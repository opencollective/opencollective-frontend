import React from 'react';
import PropTypes from 'prop-types';

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

  render() {
    const { lat, long } = this.props;
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <iframe
          width={'100%'}
          height={'100%'}
          frameBorder="0"
          scrolling="no"
          src={`http://www.openstreetmap.org/export/embed.html?bbox=${long}%2C${lat}&marker=${lat}%2C${long}&layers=ND`}
        ></iframe>
        <br />
        <small>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${long}#map=16/${lat}/${long}`}
          >
            View Larger Map
          </a>
        </small>
      </div>
    );
  }
}

export default Map;

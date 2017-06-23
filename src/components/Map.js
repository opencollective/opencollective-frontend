import React from 'react';
import PropTypes from 'prop-types';
import { Gmaps, Marker } from 'react-gmaps';

class Map extends React.Component {

  static propTypes = {
    lat: PropTypes.number,
    long: PropTypes.number,
    address: PropTypes.string
  }

  onMapCreated(map) {
    map.setOptions({
      disableDefaultUI: false
    });
  }

  render() {
    const { lat, long } = this.props;

    return (
      <div style={{width: '100%', height: '100%' }}>
        <Gmaps
          width={'100%'}
          height={'100%'}
          lat={lat}
          lng={long}
          zoom={16}
          loadingMessage={'Loading map'}
          params={{v: '3.exp', key: 'AIzaSyCRLIexl7EkMQk_0_yNsjO4Vqb_MccD-RI'}}
          onMapCreated={this.onMapCreated}>
          <Marker
            lat={lat}
            lng={long}
            draggable={false} />
        </Gmaps>
        <a className="map-overlay" href={`http://maps.apple.com/?q=${lat},${long}`} target="_blank"></a>
      </div>
    );
  }
}

export default Map;
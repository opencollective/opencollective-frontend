import React from 'react';
import { Gmaps, Marker } from 'react-gmaps';

class Map extends React.Component {

  static propTypes = {
    lat: React.PropTypes.number,
    lng: React.PropTypes.number,
    address: React.PropTypes.string
  }

  onMapCreated(map) {
    map.setOptions({
      disableDefaultUI: false
    });
  }

  render() {
    const { lat, lng } = this.props;

    return (
      <div style={{width: '100%', height: '100%' }}>
        <Gmaps
          width={'100%'}
          height={'100%'}
          lat={lat}
          lng={lng}
          zoom={16}
          loadingMessage={'Loading map'}
          params={{v: '3.exp', key: 'AIzaSyCRLIexl7EkMQk_0_yNsjO4Vqb_MccD-RI'}}
          onMapCreated={this.onMapCreated}>
          <Marker
            lat={lat}
            lng={lng}
            draggable={false} />
        </Gmaps>
        <a className="map-overlay" href={`http://maps.apple.com/?q=${lat},${lng}`} target="_blank"></a>
      </div>
    );
  }
}

export default Map;
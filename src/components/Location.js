import React from 'react';
import PropTypes from 'prop-types';
import Map from './Map';
import colors from '../constants/colors';

class Location extends React.Component {

  static propTypes = {
    location: PropTypes.string,
    address: PropTypes.string,
    lat: PropTypes.number,
    long: PropTypes.number
  }

  render() {

    const {
      location,
      address,
      lat,
      long
    } = this.props;

    return (
      <section id="location" className="location">
        <style jsx>{`
        .location {
          text-align: center;
        }
        .description {
            margin: 30px 10px;
        }
        .name {
          font-size: 1.7rem;
          font-family: 'montserratlight';
          margin: 5px 0px;
        }
        .address {
          font-family: 'lato';
        }
        `}</style>
        <div className="description">
          <h1>Location</h1>
          <div className="name">{location}</div>
          <div className="address" style={{color: colors.darkgray}}><a href={`http://maps.apple.com/?q=${lat},${long}`} target="_blank">{address}</a></div>
        </div>
        { lat && long &&
          <div className="map">
            <Map lat={lat} lng={long} />
          </div>
        }
      </section>
    );
  }
}

export default Location;
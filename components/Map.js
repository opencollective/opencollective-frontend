import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ExternalLink from './ExternalLink';
import { FormattedMessage } from 'react-intl';

const tile2Long = (tile, zoom) => {
  return (tile / Math.pow(2, zoom)) * 360 - 180;
};

const tile2Lat = (tile, zoom) => {
  const n = Math.PI - (2 * Math.PI * tile) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
};

const long2tile = (long, zoom) => {
  return Math.floor(((long + 180) / 360) * Math.pow(2, zoom));
};

const lat2tile = (lat, zoom) => {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom),
  );
};

const makeBbox = ({ x, y, zoom }) => {
  const south = tile2Lat(y + 1, zoom);
  const north = tile2Lat(y, zoom);
  const west = tile2Long(x, zoom);
  const east = tile2Long(x + 1, zoom);

  return `${west}%2C${south}%2C${east}%2C${north}`;
};

const Map = ({ lat, long }) => {
  const [src, prepareMap] = useState(null);

  useEffect(() => {
    const zoom = 16;
    const x = long2tile(long, zoom);
    const y = lat2tile(lat, zoom);
    const bbox = makeBbox({ x, y, zoom });
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat}%2C${long}&layers=ND`;

    prepareMap(src);
  }, [lat, long]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <iframe width="100%" height="100%" frameBorder="0" scrolling="no" src={src}></iframe>
      <ExternalLink
        openInNewTab
        href={`https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${long}#map=16/${lat}/${long}`}
      >
        <FormattedMessage id="map.viewLarger" defaultMessage="View Larger Map" />
      </ExternalLink>
    </div>
  );
};

Map.propTypes = {
  lat: PropTypes.number,
  long: PropTypes.number,
  address: PropTypes.string,
};

export default Map;

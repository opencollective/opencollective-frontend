import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import StyledLink from './StyledLink';

const tile2Long = (tile, zoom) => {
  // see https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
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
  // https://wiki.openstreetmap.org/wiki/Slippy_Map
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

    // Set iframe url after component has mounted to prevent https://github.com/opencollective/opencollective/issues/2845
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat}%2C${long}&layers=ND`;

    prepareMap(src);
  }, [lat, long]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <iframe title="Open Street Map" width="100%" height="100%" frameBorder="0" scrolling="no" src={src}></iframe>
      <StyledLink
        openInNewTab
        href={`https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${long}#map=16/${lat}/${long}`}
      >
        <FormattedMessage id="map.viewLarger" defaultMessage="View Larger Map" />
      </StyledLink>
    </div>
  );
};

Map.propTypes = {
  lat: PropTypes.number,
  long: PropTypes.number,
  address: PropTypes.string,
};

export default Map;

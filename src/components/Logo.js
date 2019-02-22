import React from 'react';
import PropTypes from 'prop-types';

import withFallbackImage from '../lib/withFallbackImage';

const Logo = ({ src, style = {}, height }) => {
  style.maxHeight = style.height || height;
  const backgroundStyle = { height };
  if (height && parseInt(height, 10) == height) {
    backgroundStyle.minWidth = parseInt(height, 10) / 2;
  }
  return (
    <div className="Logo" style={backgroundStyle}>
      <style jsx>
        {`
          .Logo {
            background-repeat: no-repeat;
            background-position: center center;
            background-size: cover;
            overflow: hidden;
            display: flex;
            align-items: center;
          }
          .image {
            background-repeat: no-repeat;
            background-position: center center;
            background-size: cover;
          }
        `}
      </style>
      <img className="logo" src={src} style={style} />
    </div>
  );
};

Logo.propTypes = {
  src: PropTypes.string,
  style: PropTypes.object,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default withFallbackImage(Logo);

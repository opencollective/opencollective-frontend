import React from 'react';
import PropTypes from 'prop-types';

import { defaultImage } from '../constants/collectives';
import { imagePreview, getDomain } from '../lib/utils';

const Logo = ({ src, style = {}, height, type = 'ORGANIZATION', website }) => {
  style.maxHeight = style.height || height;
  if (!src && website && type === 'ORGANIZATION') {
    src = `https://logo.clearbit.com/${getDomain(website)}`;
  }
  const backgroundStyle = { height };
  if (height && parseInt(height, 10) == height) {
    backgroundStyle.minWidth = parseInt(height, 10) / 2;
  }
  if (!src) {
    backgroundStyle.backgroundImage = `url(${defaultImage[type]})`;
  }
  const image = imagePreview(src, defaultImage[type], { height: style.maxHeight });
  return (
    <div className="Logo" style={backgroundStyle}>
      <style jsx>{`
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
      `}</style>
      <img className="logo" src={image} style={style} />
    </div>
  );
};

Logo.propTypes = {
  src: PropTypes.string,
  style: PropTypes.object,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  type: PropTypes.string,
  website: PropTypes.string,
};

export default Logo;

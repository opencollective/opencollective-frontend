import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { getCollectiveImage } from '../lib/utils';

const Logo = ({ collective, src, style = {}, height, width, className }) => {
  style.maxHeight = style.height || height;
  style.maxWidth = style.width || width;
  const backgroundStyle = { height };
  if (height && parseInt(height, 10) == height) {
    backgroundStyle.minWidth = parseInt(height, 10) / 2;
  }
  if (collective) {
    src = getCollectiveImage(collective, { name: 'logo' });
  }
  return (
    <div className={classNames('Logo', className)} style={backgroundStyle}>
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
  collective: PropTypes.object,
  src: PropTypes.string,
  style: PropTypes.object,
  className: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default Logo;

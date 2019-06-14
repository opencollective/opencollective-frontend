import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { defaultImage } from '../constants/collectives';
import { getDomain, imagePreview } from './utils';

const withFallbackImage = ChildComponent => {
  const wrapped = ({ type = 'USER', radius, height, website, name, ...props }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [src, setSrc] = useState(props.src);
    if (name === 'anonymous') {
      type = name.toUpperCase();
    }

    const fallback = defaultImage[type];

    if (!src && website && type === 'ORGANIZATION') {
      setSrc(`https://logo.clearbit.com/${getDomain(website)}`);
    }

    let image;
    if (!src) {
      image = fallback;
    } else {
      image = imagePreview(src, fallback, {
        width: radius,
        height,
      });
    }

    if (image && image !== fallback) {
      if (process.browser) {
        const img = new Image();
        img.src = image;
        img.addEventListener('error', () => {
          setSrc(fallback);
        });
      }
    }

    const childProps = {
      ...props,
      src: image,
      height,
      radius,
      type,
      name,
    };

    return <ChildComponent {...childProps} />;
  };

  wrapped.propTypes = {
    src: PropTypes.string,
    type: PropTypes.string,
    radius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    website: PropTypes.string,
    name: PropTypes.string,
  };

  return wrapped;
};

export default withFallbackImage;

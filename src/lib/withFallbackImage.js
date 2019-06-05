import React, { useState } from 'react';
import { defaultImage } from '../constants/collectives';
import { getDomain, imagePreview } from './utils';

export default ChildComponent => ({ type = 'USER', radius, height, website, name, ...props }) => {
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

import React from 'react';
import { isNil } from 'lodash';

import Container from './Container';

/**
 * A specialization of `Container` that displays itself above the content, in position
 * absolute, with a dark background and content centered.
 *
 * Accepts all the props from `Container`.
 */
const ContainerOverlay = ({ backgroundType = 'white', backgroundOpacity = undefined, ...props }) => {
  const isDark = backgroundType === 'dark';
  const defaultOpacity = isDark ? 0.5 : 0.75;
  const opacity = !isNil(backgroundOpacity) ? backgroundOpacity : defaultOpacity;
  const lightness = isDark ? '30' : '255';
  return (
    <Container
      position="absolute"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      background={`rgba(${lightness}, ${lightness}, ${lightness}, ${opacity})`}
      width="100%"
      height="100%"
      zIndex={9999}
      {...props}
    />
  );
};

export default ContainerOverlay;

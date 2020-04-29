import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';

import Container from './Container';

/**
 * A specialization of `Container` that displays itself above the content, in position
 * absolute, with a dark background and content centered.
 *
 * Accepts all the props from `Container`.
 */
const ContainerOverlay = ({ backgroundType, backgroundOpacity, ...props }) => {
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
      background={`rgba(${lightness}, ${lightness}, ${lightness}, ${opacity})`}
      width="100%"
      height="100%"
      zIndex={9999}
      {...props}
    />
  );
};

ContainerOverlay.propTypes = {
  backgroundType: PropTypes.oneOf(['dark', 'white']),
  /** If omitted, will use 0.5 for dark and 0.75 for black */
  backgroundOpacity: PropTypes.number,
};

ContainerOverlay.propTypes = {
  backgroundType: 'dark',
};

export default ContainerOverlay;

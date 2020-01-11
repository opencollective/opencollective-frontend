import React from 'react';
import Container from './Container';

/**
 * A specialization of `Container` that displays itself above the content, in position
 * absolute, with a dark background and content centered.
 *
 * Accepts all the props from `Container`.
 */
const ContainerOverlay = props => {
  return (
    <Container
      position="absolute"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      background="rgba(30, 30, 30, 0.5)"
      width="100%"
      height="100%"
      zIndex={9999}
      {...props}
    />
  );
};

export default ContainerOverlay;

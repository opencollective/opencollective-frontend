import React from 'react';
import { PropTypes } from 'prop-types';

import { Box } from '../Grid';
import Image from '../Image';

/*
 * Illustrations that use the next/image component.
 */

function NextIllustration({ display, ...props }) {
  return (
    <Box display={display}>
      <Image {...props} />
    </Box>
  );
}

NextIllustration.propTypes = {
  display: PropTypes.array,
  src: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
};

export default NextIllustration;

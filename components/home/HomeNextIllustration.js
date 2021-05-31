import React from 'react';
import { PropTypes } from 'prop-types';

import { Box } from '../Grid';
import Image from '../Image';

/*
 * Illustrations that use the next/image component.
 */

function NextIllustration(props) {
  return (
    <Box display={props.display}>
      <Image src={props.src} width={props.width} height={props.height} />
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

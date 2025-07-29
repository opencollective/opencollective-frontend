import React from 'react';

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

export default NextIllustration;

import React from 'react';

import { Box } from '../Grid';
import Image from '../Image';

/*
 * Illustrations that use the next/image component.
 */

function NextIllustration({ display, ...props }: { display?: string } & React.ComponentProps<typeof Image>) {
  return (
    <Box display={display}>
      <Image {...props} />
    </Box>
  );
}

export default NextIllustration;

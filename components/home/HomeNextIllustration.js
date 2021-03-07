import Image from 'next/image';
import styled from 'styled-components';
import { display, space } from 'styled-system';

import { rotateMixin } from '../../lib/constants/animations';

/* Temporary file that mimics HomeIllustration.js but converts img to next/image.
 * This is created to experiment with next/image on the homepage.
 */

const NextIllustration = styled(Image)`
  ${space}
  ${display}

  ${({ animate }) => (animate ? rotateMixin : null)};
`;

export default NextIllustration;

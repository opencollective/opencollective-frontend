import styled from 'styled-components';
import { display, space } from 'styled-system';

import { rotateMixin } from '../../lib/constants/animations';

const Illustration = styled.img`
  max-width: 100%;
  max-height: 100%;
  ${space}
  ${display}

  ${({ animate }) => (animate ? rotateMixin : null)};
`;

export default Illustration;

import styled from 'styled-components';
import { display, flexbox, space, textAlign, typography, width } from 'styled-system';

import { listStyle } from '../lib/styled-system-custom-properties';

const ListItem = styled.li`
  list-style: none;

  ${listStyle}
  ${space}
  ${textAlign}
  ${width}
  ${display}
  ${flexbox}
  ${typography}
`;

export default ListItem;

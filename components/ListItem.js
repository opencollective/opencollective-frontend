import styled from 'styled-components';
import { display, flexbox, space, textAlign, width } from 'styled-system';

import { listStyle } from '../lib/styled-system-custom-properties';

const ListItem = styled.li`
  list-style: none;

  ${listStyle}
  ${space}
  ${textAlign}
  ${width}
  ${display}
  ${flexbox}
`;

export default ListItem;

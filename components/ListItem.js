import styled from 'styled-components';
import { space, textAlign, width, display, flexbox } from 'styled-system';
import { listStyle } from '../lib/styled_system_custom';

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

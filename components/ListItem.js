import styled from 'styled-components';
import { space, textAlign, width, display, flexbox } from 'styled-system';
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

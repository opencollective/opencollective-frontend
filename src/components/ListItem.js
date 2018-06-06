import styled from 'styled-components';
import {
  space,
  style,
  textAlign,
  width,
} from 'styled-system';

export const listStyle = style({ prop: 'listStyle' });

const ListItem = styled.li`
  list-style: none;

  ${listStyle}
  ${space}
  ${textAlign}
  ${width}
`;

export default ListItem;

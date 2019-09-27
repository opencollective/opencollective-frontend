import styled from 'styled-components';
import { background, border, color, space, typography, layout, position } from 'styled-system';
import { messageType } from '../lib/theme';

/** Simple tag to display a short string */
const StyledTag = styled.span`
  border-radius: 4px;
  padding: 8px 6px;
  font-size: 8px;
  letter-spacing: 0.2em;
  line-height: 12px;
  text-transform: uppercase;
  background: #F0F2F5;
  color: #71757A;
  text-align: center;

  ${background}
  ${border}
  ${color}
  ${space}
  ${border}
  ${typography}
  ${layout}
  ${position}

  ${messageType}
`;

/** @component */
export default StyledTag;

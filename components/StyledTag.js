import tag from 'clean-tag';
import styled from 'styled-components';
import { background, border, color, space, typography, layout } from 'styled-system';

/** Simple tag to display a short string */
const StyledTag = styled(tag.span)`
  border-radius: 4px;
  padding: 8px 6px;
  font-size: 8px;
  letter-spacing: 0.2em;
  line-height: 12px;
  text-transform: uppercase;
  background: #F0F2F5;
  color: #71757A;

  ${background}
  ${border}
  ${color}
  ${space}
  ${border}
  ${typography}
  ${layout}
`;

/** @component */
export default StyledTag;

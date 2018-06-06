import styled from 'styled-components';
import {
  active,
  backgroundColor,
  border,
  borderRadius,
  color,
  display,
  fontFamily,
  fontSize,
  fontWeight,
  hover,
  space,
  textAlign,
  width,
} from 'styled-system'; 
import { whiteSpace } from './Text';

const StyledLink = styled.a`
  ${active}
  ${backgroundColor}
  ${border}
  ${borderRadius}
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontWeight}
  ${hover}
  ${space}
  ${textAlign}
  ${whiteSpace}
  ${width}
`;

export default StyledLink;

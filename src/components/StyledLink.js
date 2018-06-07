import styled from 'styled-components';
import {
  active,
  bgColor,
  border,
  borderRadius,
  color,
  display,
  fontFamily,
  fontSize,
  fontWeight,
  hover,
  maxWidth,
  space,
  textAlign,
  width,
} from 'styled-system'; 
import { whiteSpace } from './Text';

const StyledLink = styled.a`
  ${active}
  ${bgColor}
  ${border}
  ${borderRadius}
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontWeight}
  ${hover}
  ${maxWidth}
  ${space}
  ${textAlign}
  ${whiteSpace}
  ${width}
`;

export default StyledLink;

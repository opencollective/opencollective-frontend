import styled from 'styled-components';
import {
  bgColor,
  border,
  borderRadius,
  color,
  display,
  fontFamily,
  fontSize,
  fontWeight,
  maxWidth,
  space,
  style,
  textAlign,
  width,
} from 'styled-system';
import { whiteSpace } from './Text';

const textDecoration = style({
  prop: 'textDecoration',
});

const StyledLink = styled.a`
  ${bgColor}
  ${border}
  ${borderRadius}
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontWeight}
  ${maxWidth}
  ${space}
  ${textAlign}
  ${textDecoration}
  ${whiteSpace}
  ${width}
`;

export default StyledLink;

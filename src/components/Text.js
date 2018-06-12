import styled from 'styled-components';
import {
  color,
  display,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  space,
  style,
  textAlign,
  width
} from 'styled-system';

export const textTransform = style({
  prop: 'textTransform',
});

export const whiteSpace = style({
  prop: 'whiteSpace',
});

export const P = styled.p`
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontWeight}
  ${lineHeight}
  ${letterSpacing}
  ${space}
  ${textAlign}
  ${textTransform}
  ${whiteSpace}
`;

P.defaultProps = {
  m: 0,
};

export const Label = styled.label`
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontWeight}
  ${lineHeight}
  ${letterSpacing}
  ${space}
  ${textAlign}
  ${textTransform}
  ${whiteSpace}
  ${width}
`;

Label.defaultProps = {
  m: 0,
  width: "100%",
  fontWeight: "bold"
};
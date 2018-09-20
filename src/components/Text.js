import styled from 'styled-components';
import {
  color,
  display,
  fontFamily,
  fontSize,
  fontStyle,
  fontWeight,
  lineHeight,
  letterSpacing,
  space,
  style,
  textAlign,
} from 'styled-system';

export const textTransform = style({
  prop: 'textTransform',
});

export const whiteSpace = style({
  prop: 'whiteSpace',
});

export const Span = styled.span`
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontStyle}
  ${fontWeight}
  ${lineHeight}
  ${letterSpacing}
  ${space}
  ${textAlign}
  ${textTransform}
  ${whiteSpace}
`;

export const P = styled.p`
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontStyle}
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
  letterSpacing: '-0.2px',
};

export const H1 = styled.h1`
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontStyle}
  ${fontWeight}
  ${lineHeight}
  ${letterSpacing}
  ${space}
  ${textAlign}
  ${textTransform}
  ${whiteSpace}
`;

H1.defaultProps = {
  fontSize: '3.6rem',
  fontWeight: 'bold',
  m: 0,
};

export const H2 = styled.h2`
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontStyle}
  ${fontWeight}
  ${lineHeight}
  ${letterSpacing}
  ${space}
  ${textAlign}
  ${textTransform}
  ${whiteSpace}
`;

H2.defaultProps = {
  fontSize: '3rem',
  fontWeight: 'bold',
  m: 0,
};

export const H3 = styled.h3`
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontStyle}
  ${fontWeight}
  ${lineHeight}
  ${letterSpacing}
  ${space}
  ${textAlign}
  ${textTransform}
  ${whiteSpace}
`;

H3.defaultProps = {
  fontSize: '2.4rem',
  fontWeight: 'bold',
  m: 0,
};

export const H4 = styled.h4`
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontStyle}
  ${fontWeight}
  ${lineHeight}
  ${letterSpacing}
  ${space}
  ${textAlign}
  ${textTransform}
  ${whiteSpace}
`;

H4.defaultProps = {
  fontSize: '1.8rem',
  fontWeight: 'bold',
  m: 0,
};

export const H5 = styled.h5`
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontStyle}
  ${fontWeight}
  ${lineHeight}
  ${letterSpacing}
  ${space}
  ${textAlign}
  ${textTransform}
  ${whiteSpace}
`;

H5.defaultProps = {
  fontSize: '2rem',
  lineHeight: '2.4rem',
  textAlign: 'center',
  fontWeight: 500,
  color: '#313233',
  m: 0,
};

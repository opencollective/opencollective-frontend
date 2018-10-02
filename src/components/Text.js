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
import tag from 'clean-tag';

export const textTransform = style({
  prop: 'textTransform',
});

export const whiteSpace = style({
  prop: 'whiteSpace',
});

export const cursor = style({
  prop: 'cursor',
});

export const P = styled(tag.p)`
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
  ${cursor}
`;

P.defaultProps = {
  m: 0,
  letterSpacing: '-0.2px',
};

export const Span = P.withComponent(tag.span);

export const H1 = P.withComponent(tag.h1);

H1.defaultProps = {
  fontSize: '3.6rem',
  fontWeight: 'bold',
  m: 0,
};

export const H2 = P.withComponent(tag.h2);

H2.defaultProps = {
  fontSize: '3rem',
  fontWeight: 'bold',
  m: 0,
};

export const H3 = P.withComponent(tag.h3);

H3.defaultProps = {
  fontSize: '2.4rem',
  fontWeight: 'bold',
  m: 0,
};

export const H4 = P.withComponent(tag.h4);

H4.defaultProps = {
  fontSize: '1.8rem',
  fontWeight: 'bold',
  m: 0,
};

export const H5 = P.withComponent(tag.h5);

H5.defaultProps = {
  fontSize: '2rem',
  lineHeight: '2.4rem',
  textAlign: 'center',
  fontWeight: 500,
  color: '#313233',
  m: 0,
};

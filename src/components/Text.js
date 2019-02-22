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
  blacklist: tag.defaultProps.blacklist.concat(['textTransform', 'whiteSpace']),
  fontSize: 'Paragraph',
  letterSpacing: '-0.2px',
  lineHeight: 'Paragraph',
  m: 0,
};

export const Span = P.withComponent(tag.span);

Span.defaultProps = {
  ...P.defaultProps,
  fontSize: 'inherit',
  lineHeight: 'inherit',
};

export const H1 = P.withComponent(tag.h1);

H1.defaultProps = {
  ...P.defaultProps,
  fontSize: 'H1',
  fontWeight: 'bold',
  letterSpacing: '-1.2px',
  lineHeight: 'H1',
};

export const H2 = P.withComponent(tag.h2);

H2.defaultProps = {
  ...P.defaultProps,
  fontSize: 'H2',
  fontWeight: 'bold',
  letterSpacing: '-0.4px',
  lineHeight: 'H2',
};

export const H3 = P.withComponent(tag.h3);

H3.defaultProps = {
  ...P.defaultProps,
  fontSize: 'H3',
  fontWeight: 'bold',
  letterSpacing: '-0.4px',
  lineHeight: 'H3',
};

export const H4 = P.withComponent(tag.h4);

H4.defaultProps = {
  ...P.defaultProps,
  fontSize: 'H4',
  fontWeight: 'bold',
  letterSpacing: '-0.2px',
  lineHeight: 'H4',
};

export const H5 = P.withComponent(tag.h5);

H5.defaultProps = {
  ...P.defaultProps,
  fontSize: 'H5',
  letterSpacing: '-0.2px',
  lineHeight: 'H5',
  textAlign: 'center',
  fontWeight: 500,
  color: 'black.800',
};

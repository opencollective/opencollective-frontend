import styled, { css } from 'styled-components';
import { color, display, space, typography } from 'styled-system';

import { textTransform, whiteSpace, wordBreak, cursor } from '../lib/styled-system-custom-properties';

export const P = styled.p.attrs(props => ({
  // Overrides default margin Y to avoid global styles
  mb: props.mb || props.my || props.m || 0,
  mt: props.mt || props.my || props.m || 0,
}))`
  ${color}
  ${display}
  ${space}
  ${typography}
  ${textTransform}
  ${whiteSpace}
  ${wordBreak}
  ${cursor}
  ${props =>
    props.truncateOverflow &&
    css`
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    `}
`;

P.defaultProps = {
  fontSize: 'Paragraph',
  letterSpacing: '-0.4px',
  lineHeight: 'Paragraph',
};

export const Span = P.withComponent('span');

export const Label = P.withComponent('label');

Span.defaultProps = {
  ...P.defaultProps,
  fontSize: 'inherit',
  lineHeight: 'inherit',
};

export const H1 = P.withComponent('h1');

H1.defaultProps = {
  ...P.defaultProps,
  fontSize: 'H1',
  fontWeight: 'bold',
  letterSpacing: '-1.2px',
  lineHeight: 'H1',
  textAlign: 'left',
};

export const H2 = P.withComponent('h2');

H2.defaultProps = {
  ...P.defaultProps,
  fontSize: 'H2',
  fontWeight: 'bold',
  letterSpacing: '-0.4px',
  lineHeight: 'H2',
};

export const H3 = P.withComponent('h3');

H3.defaultProps = {
  ...P.defaultProps,
  fontSize: 'H3',
  fontWeight: 'bold',
  letterSpacing: '-0.4px',
  lineHeight: 'H3',
};

export const H4 = P.withComponent('h4');

H4.defaultProps = {
  ...P.defaultProps,
  fontSize: 'H4',
  fontWeight: 'bold',
  letterSpacing: '-0.4px',
  lineHeight: 'H4',
};

export const H5 = P.withComponent('h5');

H5.defaultProps = {
  ...P.defaultProps,
  fontSize: 'H5',
  letterSpacing: '-0.4px',
  lineHeight: 'H5',
  fontWeight: 500,
  color: 'black.900',
};

import styled, { css } from 'styled-components';
import { color, display, space, typography } from 'styled-system';

import { cursor, textTransform, whiteSpace, wordBreak } from '../lib/styled-system-custom-properties';

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
  fontSize: '14px',
  letterSpacing: '-0.4px',
  lineHeight: '1.15em',
};

export const Span = P.withComponent('span');

Span.defaultProps = {
  ...P.defaultProps,
  fontSize: 'inherit',
  lineHeight: 'inherit',
};

export const Label = P.withComponent('label');

export const Strong = P.withComponent('strong');

export const H1 = P.withComponent('h1');

H1.defaultProps = {
  ...P.defaultProps,
  fontSize: '52px',
  fontWeight: 'bold',
  letterSpacing: '-1.2px',
  lineHeight: '56px',
  textAlign: 'left',
};

export const H2 = P.withComponent('h2');

H2.defaultProps = {
  ...P.defaultProps,
  fontSize: '40px',
  fontWeight: 'bold',
  letterSpacing: '-0.4px',
  lineHeight: '44px',
};

export const H3 = P.withComponent('h3');

H3.defaultProps = {
  ...P.defaultProps,
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '-0.4px',
  lineHeight: '36px',
};

export const H4 = P.withComponent('h4');

H4.defaultProps = {
  ...P.defaultProps,
  fontSize: '24px',
  fontWeight: 'bold',
  letterSpacing: '-0.4px',
  lineHeight: '32px',
};

export const H5 = P.withComponent('h5');

H5.defaultProps = {
  ...P.defaultProps,
  fontSize: '20px',
  letterSpacing: '-0.4px',
  lineHeight: '24px',
  fontWeight: 500,
  color: 'black.900',
};

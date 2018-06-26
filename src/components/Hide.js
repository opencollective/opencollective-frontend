import styled from 'styled-components';
import { Box } from 'grid-styled';
import {
  bottom,
  height,
  left,
  position,
  right,
  top,
} from 'styled-system';

export const breakpoints = {
  xs: '@media screen and (max-width: 40em)',
  sm: '@media screen and (min-width: 40em) and (max-width: 52em)',
  md: '@media screen and (min-width: 52em) and (max-width: 64em)',
  lg: '@media screen and (min-width: 64em)',
};

export const hidden = key => props => props[key] ? {
  [breakpoints[key]]: {
    display: 'none'
  }
} : null;

export const xs = hidden('xs');
export const sm = hidden('sm');
export const md = hidden('md');
export const lg = hidden('lg');

const Hide = styled(Box)`
  ${xs}
  ${sm}
  ${md}
  ${lg}

  ${bottom}
  ${height}
  ${left}
  ${position}
  ${right}
  ${top}
`;

export default Hide;

import styled from 'styled-components';
import { bottom, flex, height, left, position, right, top } from 'styled-system';

import { pointerEvents } from '../lib/styled-system-custom-properties';

import { Box } from './Grid';

const breakpoints = {
  xs: '@media screen and (max-width: 40em)',
  sm: '@media screen and (min-width: 40em) and (max-width: 52em)',
  md: '@media screen and (min-width: 52em) and (max-width: 64em)',
  lg: '@media screen and (min-width: 64em)',
};

// eslint-disable-next-line react/display-name
const hidden = key => props =>
  props[key]
    ? {
        [breakpoints[key]]: {
          display: 'none',
        },
      }
    : null;

const xs = hidden('xs');
const sm = hidden('sm');
const md = hidden('md');
const lg = hidden('lg');

const Hide = styled(Box)<{ xs?: boolean; sm?: boolean; md?: boolean; lg?: boolean }>`
  ${xs}
  ${sm}
  ${md}
  ${lg}

  ${bottom}
  ${height}
  ${left}
  ${pointerEvents}
  ${position}
  ${right}
  ${top}
  ${flex}
`;

export default Hide;

import { styled } from 'styled-components';
import { bottom, flex, height, left, position, right, top } from 'styled-system';

import { pointerEvents } from '../lib/styled-system-custom-properties';
import { defaultShouldForwardProp } from '@/lib/styled_components_utils';

import { Box } from './Grid';

const breakpoints = {
  xs: '@media screen and (max-width: 40em)',
  sm: '@media screen and (min-width: 40em) and (max-width: 52em)',
  md: '@media screen and (min-width: 52em) and (max-width: 64em)',
  lg: '@media screen and (min-width: 64em)',
};

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

const FILTERED_PROPS = new Set(['xs', 'sm', 'md', 'lg']);

const Hide = styled(Box).withConfig({
  shouldForwardProp: prop => defaultShouldForwardProp(prop) && !FILTERED_PROPS.has(prop),
})<{ xs?: boolean; sm?: boolean; md?: boolean; lg?: boolean }>`
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

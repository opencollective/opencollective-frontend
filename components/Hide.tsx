import { styled } from 'styled-components';
import { bottom, compose, flex, height, left, position, right, top } from 'styled-system';

import { pointerEvents } from '../lib/styled-system-custom-properties';
import { shouldForwardPropExcept } from '@/lib/styled_components_utils';

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

// Style props should not be forwarded to the DOM, nor to components passed with `as`
const FILTERED_PROPS = new Set([
  ...compose(bottom, height, left, pointerEvents, position, right, top, flex).propNames,
  'xs',
  'sm',
  'md',
  'lg',
]);

const Hide = styled(Box).withConfig({
  shouldForwardProp: shouldForwardPropExcept(FILTERED_PROPS),
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

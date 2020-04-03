import styled from 'styled-components';
import { Box } from '@rebass/grid';
import { bottom, height, left, position, right, top } from 'styled-system';
import PropTypes from 'prop-types';

import { pointerEvents } from '../lib/styled-system-custom-properties';

export const breakpoints = {
  xs: '@media screen and (max-width: 40em)',
  sm: '@media screen and (min-width: 40em) and (max-width: 52em)',
  md: '@media screen and (min-width: 52em) and (max-width: 64em)',
  lg: '@media screen and (min-width: 64em)',
};

export const hidden = key => props =>
  props[key]
    ? {
        [breakpoints[key]]: {
          display: 'none',
        },
      }
    : null;

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
  ${pointerEvents}
  ${position}
  ${right}
  ${top}
`;

Hide.propTypes = {
  xs: PropTypes.bool,
  sm: PropTypes.bool,
  md: PropTypes.bool,
  lg: PropTypes.bool,
  ...bottom.propTypes,
  ...height.propTypes,
  ...left.propTypes,
  ...position.propTypes,
  ...right.propTypes,
  ...top.propTypes,
};

export default Hide;

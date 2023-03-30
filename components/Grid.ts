/**
 * This file is a copy-paste from https://github.com/rebassjs/grid/blob/master/src/index.js.
 * See https://github.com/opencollective/opencollective/issues/2929 for more info.
 */

import propTypes from '@styled-system/prop-types';
import styled from 'styled-components';
import {
  color,
  ColorProps,
  compose,
  flexbox,
  FlexboxProps,
  grid,
  GridProps,
  layout,
  LayoutProps,
  space,
  SpaceProps,
  typography,
  TypographyProps,
} from 'styled-system';

export const boxProps = compose(space, color, layout, typography, flexbox, grid);

type BoxProps = SpaceProps &
  ColorProps &
  FlexboxProps &
  GridProps &
  LayoutProps &
  TypographyProps & {
    gap?: string | number;
    css?: string | object;
  };

export const Box = styled.div<BoxProps>(
  {
    boxSizing: 'border-box',
  },
  boxProps,
);

Box.displayName = 'Box';

Box.propTypes = {
  ...propTypes.space,
  ...propTypes.color,
  ...propTypes.layout,
  ...propTypes.typography,
  ...propTypes.flexbox,
};

export type FlexProps = BoxProps;

export const Flex = styled(Box)<FlexProps>(
  props => ({
    display: 'flex',
    gap: props.gap,
  }),
  compose(space, layout, flexbox),
);

Flex.displayName = 'Flex';

export const Grid = styled.div<BoxProps>(
  {
    boxSizing: 'border-box',
    display: 'grid',
    '> div': { 'min-width': 0 },
  },
  compose(space, grid, layout, flexbox),
);

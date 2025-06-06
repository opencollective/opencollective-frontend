/**
 * This file is a copy-paste from https://github.com/rebassjs/grid/blob/master/src/index.js.
 * See https://github.com/opencollective/opencollective/issues/2929 for more info.
 */

import styled from 'styled-components';
import type { ColorProps, FlexboxProps, GridProps, LayoutProps, SpaceProps, TypographyProps } from 'styled-system';
import { border, color, compose, flexbox, grid, layout, space, typography } from 'styled-system';

import { defaultShouldForwardProp } from '@/lib/styled_components_utils';

export const boxProps = compose(space, color, layout, typography, flexbox, grid, border);

type BoxProps = SpaceProps &
  ColorProps &
  FlexboxProps &
  GridProps &
  LayoutProps &
  TypographyProps & {
    gap?: string | number;
    css?: string | object;
  };

const FILTERED_PROPS = new Set(['display', 'width', 'height']);

export const Box = styled.div.withConfig({
  shouldForwardProp: prop => defaultShouldForwardProp(prop) && !FILTERED_PROPS.has(prop),
})<BoxProps>(
  {
    boxSizing: 'border-box',
  },
  boxProps,
);

Box.displayName = 'Box';

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

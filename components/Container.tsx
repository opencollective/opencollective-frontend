import type React from 'react';
import type { CSSProp } from 'styled-components';
import { styled } from 'styled-components';
import type {
  BackgroundProps,
  BorderProps,
  ColorProps,
  FlexboxProps,
  LayoutProps,
  PositionProps,
  ShadowProps,
  SizeProps,
  SpaceProps,
  TypographyProps,
} from 'styled-system';
import { background, border, color, flexbox, layout, position, shadow, size, space, typography } from 'styled-system';

import type {
  ClearProps,
  CursorProps,
  FloatProps,
  OverflowProps,
  PointerEventsProps,
  WhiteSpaceProps,
  WordBreakProps,
} from '../lib/styled-system-custom-properties';
import {
  clear,
  cursor,
  float,
  overflow,
  pointerEvents,
  whiteSpace,
  wordBreak,
} from '../lib/styled-system-custom-properties';
import { defaultShouldForwardProp } from '@/lib/styled_components_utils';

export type ContainerProps = FlexboxProps &
  BackgroundProps &
  BorderProps &
  LayoutProps &
  ShadowProps &
  ClearProps &
  ColorProps &
  CursorProps &
  FloatProps &
  OverflowProps &
  PointerEventsProps &
  PositionProps &
  SpaceProps &
  TypographyProps &
  WhiteSpaceProps &
  SizeProps &
  WordBreakProps &
  React.HTMLProps<HTMLDivElement> & {
    clearfix?: boolean;
    css?: CSSProp;
  };

const FILTERED_PROPS = new Set([
  'display',
  'width',
  'height',
  'overflow',
  'borderWidth',
  'borderStyle',
  'borderColor',
  'borderRadius',
  'overflowX',
  'overflowY',
  'boxShadow',
  'textAlign',
]);

const Container = styled.div.withConfig({
  shouldForwardProp: (prop, target) => defaultShouldForwardProp(prop, target) && !FILTERED_PROPS.has(prop),
})<ContainerProps>`
  box-sizing: border-box;

  ${flexbox}
  ${background}
  ${border}
  ${shadow}
  ${clear}
  ${color}
  ${cursor}
  ${float}
  ${overflow}
  ${pointerEvents}
  ${position}
  ${layout}
  ${space}
  ${size}
  ${typography}
  ${whiteSpace}
  ${wordBreak}
  ${props =>
    props.clearfix &&
    `
      &::after {
        content: "";
        display: table;
        clear: both;
      }
    `}
`;

export default Container;

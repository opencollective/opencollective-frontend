import type React from 'react';
import type { CSSProp } from 'styled-components';
import styled from 'styled-components';
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

const Container = styled.div<ContainerProps>`
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
      ::after {
        content: "";
        display: table;
        clear: both;
      }
    `}
`;

export default Container;

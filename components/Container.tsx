import React from 'react';
import styled, { CSSProp } from 'styled-components';
import {
  background,
  BackgroundProps,
  border,
  BorderProps,
  color,
  ColorProps,
  flexbox,
  FlexboxProps,
  layout,
  LayoutProps,
  position,
  PositionProps,
  shadow,
  ShadowProps,
  size,
  SizeProps,
  space,
  SpaceProps,
  typography,
  TypographyProps,
} from 'styled-system';

import {
  clear,
  ClearProps,
  cursor,
  CursorProps,
  float,
  FloatProps,
  overflow,
  OverflowProps,
  pointerEvents,
  PointerEventsProps,
  whiteSpace,
  WhiteSpaceProps,
  wordBreak,
  WordBreakProps,
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

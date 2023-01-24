import React from 'react';
import styled from 'styled-components';
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
} from '../lib/styled-system-custom-properties';

type ContainerProps = FlexboxProps &
  BackgroundProps &
  BorderProps &
  ShadowProps &
  ClearProps &
  ColorProps &
  CursorProps &
  FloatProps &
  OverflowProps &
  PointerEventsProps &
  PositionProps &
  LayoutProps &
  SpaceProps &
  TypographyProps &
  WhiteSpaceProps &
  React.HTMLProps<HTMLDivElement> & {
    clearfix?: boolean;
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
  ${typography}
  ${whiteSpace}
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

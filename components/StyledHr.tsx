import propTypes from '@styled-system/prop-types';
import { themeGet } from '@styled-system/theme-get';
import type React from 'react';
import styled from 'styled-components';
import type { BorderProps, DisplayProps, FlexProps, LayoutProps, ShadowProps, SpaceProps } from 'styled-system';
import { border, display, flex, layout, shadow, space } from 'styled-system';

type StyledHrProps = SpaceProps &
  FlexProps &
  LayoutProps &
  ShadowProps &
  BorderProps &
  DisplayProps &
  React.HTMLProps<HTMLHRElement>;

/**
 * An horizontal line. Control the color and size using border properties.
 */
const StyledHr = styled.hr<StyledHrProps>`
  border: 0;
  border-top: 1px solid ${themeGet('colors.black.400')};
  margin: 0;
  height: 1px;

  ${space}
  ${flex}
  ${layout}
  ${shadow}
  ${border}
  ${display}
`;

StyledHr.propTypes = {
  ...propTypes.space,
  ...propTypes.flex,
  ...propTypes.layout,
  ...propTypes.shadow,
  ...propTypes.border,
  ...propTypes.display,
};

/** @component */
export default StyledHr;

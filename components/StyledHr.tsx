import { themeGet } from '@styled-system/theme-get';
import type React from 'react';
import { styled } from 'styled-components';
import type { BorderProps, DisplayProps, FlexProps, LayoutProps, ShadowProps, SpaceProps } from 'styled-system';
import { border, display, flex, layout, shadow, space } from 'styled-system';

import { defaultShouldForwardProp } from '@/lib/styled_components_utils';

type StyledHrProps = SpaceProps &
  FlexProps &
  LayoutProps &
  ShadowProps &
  BorderProps &
  DisplayProps &
  React.HTMLProps<HTMLHRElement>;

/**
 * An horizontal line. Control the color and size using border properties.
 *
 * @deprecated Use `ui/Separator` instead
 */
const StyledHr = styled.hr.withConfig({
  shouldForwardProp: (prop, target) => defaultShouldForwardProp(prop, target),
})<StyledHrProps>`
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

/** @component */
export default StyledHr;

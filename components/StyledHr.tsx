import { themeGet } from '@styled-system/theme-get';
import type React from 'react';
import { styled } from 'styled-components';
import type { BorderProps, DisplayProps, FlexProps, LayoutProps, ShadowProps, SpaceProps } from 'styled-system';
import { border, compose, display, flex, layout, shadow, space } from 'styled-system';

import { shouldForwardPropExcept } from '@/lib/styled_components_utils';

type StyledHrProps = SpaceProps &
  FlexProps &
  LayoutProps &
  ShadowProps &
  BorderProps &
  DisplayProps &
  React.HTMLProps<HTMLHRElement>;

// Style props should not be forwarded to the DOM, nor to components passed with `as`
const FILTERED_PROPS = new Set(compose(space, flex, layout, shadow, border, display).propNames);

/**
 * An horizontal line. Control the color and size using border properties.
 *
 * @deprecated Use `ui/Separator` instead
 */
const StyledHr = styled.hr.withConfig({
  shouldForwardProp: shouldForwardPropExcept(FILTERED_PROPS),
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

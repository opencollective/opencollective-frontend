import propTypes from '@styled-system/prop-types';
import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';
import {
  border,
  BorderProps,
  display,
  DisplayProps,
  flex,
  FlexboxProps,
  layout,
  LayoutProps,
  shadow,
  ShadowProps,
  space,
  SpaceProps,
} from 'styled-system';

type StyledHrProps = SpaceProps & FlexboxProps & LayoutProps & ShadowProps & BorderProps & DisplayProps;

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
  ...propTypes.border,
  ...propTypes.layout,
  ...propTypes.shadow,
  ...propTypes.space,
};

/** @component */
export default StyledHr;

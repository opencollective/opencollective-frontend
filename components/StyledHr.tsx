import propTypes from '@styled-system/prop-types';
import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';
import {
  border,
  BorderProps,
  display,
  DisplayProps,
  flex,
  FlexProps,
  layout,
  LayoutProps,
  shadow,
  ShadowProps,
  space,
  SpaceProps,
} from 'styled-system';

type StyledSelectProps = SpaceProps & FlexProps & LayoutProps & ShadowProps & BorderProps & DisplayProps;

/**
 * An horizontal line. Control the color and size using border properties.
 */
const StyledHr = styled.hr<StyledSelectProps>`
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

import styled from 'styled-components';
import { space, layout, shadow, border, flex } from 'styled-system';
import themeGet from '@styled-system/theme-get';
import propTypes from '@styled-system/prop-types';

/**
 * An horizontal line. Control the color and size using border properties.
 */
const StyledHr = styled.hr`
  border: 0;
  border-top: 1px solid ${themeGet('colors.black.400')};
  margin: 0;
  height: 1px;

  ${space}
  ${flex}
  ${layout}
  ${shadow}
  ${border}
`;

StyledHr.propTypes = {
  ...propTypes.border,
  ...propTypes.layout,
  ...propTypes.shadow,
  ...propTypes.space,
};

/** @component */
export default StyledHr;

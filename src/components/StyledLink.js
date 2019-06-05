import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  backgroundColor,
  border,
  borderColor,
  borderRadius,
  color,
  display,
  fontFamily,
  fontSize,
  fontWeight,
  maxWidth,
  space,
  textAlign,
  width,
} from 'styled-system';
import themeGet from '@styled-system/theme-get';
import tag from 'clean-tag';
import { whiteSpace, textDecoration } from '../lib/styled_system_custom';
import { buttonSize, buttonStyle } from '../constants/theme';

/**
 * styled-component anchor tag using styled-system
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledLink = styled(tag.a)`
  ${backgroundColor}
  ${border}
  ${borderColor}
  ${borderRadius}
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontWeight}
  ${maxWidth}
  ${space}
  ${textAlign}
  ${textDecoration}
  ${whiteSpace}
  ${width}

  ${buttonStyle}
  ${buttonSize}

  &[disabled] {
    pointer-events: none;
    cursor: default;
    text-decoration: none;
    color: ${themeGet('colors.black.300')};
  }
`;

StyledLink.propTypes = {
  /** @ignore */
  omitProps: PropTypes.arrayOf(PropTypes.string),
  /**
   * Based on the design system theme
   */
  buttonSize: PropTypes.oneOf(['small', 'medium', 'large']),
  /**
   * Based on the design system theme
   */
  buttonStyle: PropTypes.oneOf(['primary', 'standard']),
  /**
   * styled-system prop: accepts any css 'color' value or theme alias
   * See src/constants/theme.js for the list of theme colors
   */
  color: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'display' value */
  display: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'font-size' value */
  fontSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'font-weight' value */
  fontWeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  href: PropTypes.string,
  /**
   * styled-system prop: adds margin & padding props
   * see: https://github.com/jxnblk/styled-system/blob/master/docs/api.md#space
   */
  space: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'text-align' value */
  textAlign: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'text-decoration' value */
  textDecoration: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** Disable the link, make it unclickable */
  disabled: PropTypes.bool,
};

StyledLink.defaultProps = {
  omitProps: tag.defaultProps.omitProps.concat('buttonStyle', 'buttonSize', 'whiteSpace'),
};

/** @component */
export default StyledLink;

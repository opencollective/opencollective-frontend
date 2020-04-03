import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { border, color, layout, space, typography } from 'styled-system';
import themeGet from '@styled-system/theme-get';
import { whiteSpace, textDecoration } from '../lib/styled-system-custom-properties';
import { buttonSize, buttonStyle } from '../lib/theme/variants/button';

/**
 * styled-component anchor tag using styled-system
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledLink = styled.a`
  color: ${themeGet('colors.primary.500')};
  cursor: pointer;
  text-decoration: none;

  &:hover {
    color: ${themeGet('colors.primary.300')};
  }

  ${border}
  ${color}
  ${layout}
  ${space}
  ${typography}
  ${textDecoration}
  ${whiteSpace}

  ${props =>
    props.buttonStyle &&
    css`
      outline: 0;
      border: 1px solid;
      border-style: solid;
      border-width: 1px;
      border-radius: 100px;
      text-align: center;

      &:disabled {
        cursor: not-allowed;
      }
    `}

  ${buttonStyle}
  ${buttonSize}

  &[disabled] {
    pointer-events: none;
    cursor: default;
    text-decoration: none;
    color: ${themeGet('colors.black.300')};
  }

  ${props =>
    props.truncateOverflow &&
    css`
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    `}
`;

StyledLink.propTypes = {
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
   * See lib/theme/colors.js for the list of theme colors
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
  /** Wether text should be truncated if too long */
  truncateOverflow: PropTypes.bool,
};

/** @component */
export default StyledLink;

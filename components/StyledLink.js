import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import styled, { css } from 'styled-components';
import { background, border, color, layout, space, typography } from 'styled-system';

import { textDecoration, whiteSpace } from '../lib/styled-system-custom-properties';
import theme from '../lib/theme';
import { buttonSize, buttonStyle } from '../lib/theme/variants/button';

/**
 * styled-component anchor tag using styled-system
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledLink = styled.a.attrs(props => {
  if (props.openInNewTab) {
    return {
      target: '_blank',
      rel: 'noopener noreferrer',
    };
  }
  if (props.openInNewTabNoFollow) {
    return {
      target: '_blank',
      rel: 'noopener noreferrer nofollow',
    };
  }
})`
  color: ${themeGet(`colors.primary.500`)};
  cursor: pointer;
  text-decoration: none;

  &:hover {
    color: ${themeGet(`colors.primary.400`)};
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
  ${background}

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
  buttonSize: PropTypes.oneOf(Object.keys(theme.buttonSizes)),
  /**
   * Based on the design system theme
   */
  buttonStyle: PropTypes.oneOf(Object.keys(theme.buttons)),
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
  href: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
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
  /** If true, the link will open in a new tab when clicked */
  openInNewTab: PropTypes.bool,
  /** If true, the link will open in a new tab and also adds rel=nofollow */
  openInNewTabNoFollow: PropTypes.bool,
};

/** @component */
export default StyledLink;

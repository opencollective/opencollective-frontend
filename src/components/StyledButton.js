import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import tag from 'clean-tag';
import {
  bgColor,
  border,
  borderRadius,
  color,
  display,
  fontFamily,
  fontSize,
  fontWeight,
  minWidth,
  maxWidth,
  space,
  textAlign,
  width,
} from 'styled-system';
import { buttonSize, buttonStyle } from '../constants/theme';
import StyledSpinner from './StyledSpinner';

/**
 * styled-component button using styled-system
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledButtonContent = styled(tag.button)`
  appearance: none;
  border: none;
  cursor: pointer;
  outline: 0;

  ${bgColor}
  ${border}
  ${borderRadius}
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontWeight}
  ${minWidth}
  ${maxWidth}
  ${space}
  ${textAlign}
  ${width}

  ${buttonStyle}
  ${buttonSize}
`;

const StyledButton = ({ loading, ...props }) =>
  !loading ? (
    <StyledButtonContent {...props} />
  ) : (
    <StyledButtonContent {...props}>
      <StyledSpinner />
    </StyledButtonContent>
  );

StyledButton.propTypes = {
  /** @ignore */
  blacklist: PropTypes.arrayOf(PropTypes.string),
  /**
   * Based on the design system theme
   */
  buttonSize: PropTypes.oneOf(['small', 'medium', 'large']),
  /**
   * Based on the design system theme
   */
  buttonStyle: PropTypes.oneOf(['primary', 'standard']),
  /**
   * From styled-system: accepts any css 'display' value
   */
  display: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /**
   * From styled-system: accepts any css 'font-weight' value
   */
  fontWeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /**
   * From styled-system: accepts any css 'min-width' value
   */
  minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /**
   * From styled-system: accepts any css 'max-width' value
   */
  maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /**
   * styled-system prop: adds margin & padding props
   * see: https://github.com/jxnblk/styled-system/blob/master/docs/api.md#space
   */
  space: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /**
   * From styled-system: accepts any css 'text-align' value
   */
  textAlign: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /**
   * From styled-system: accepts any css 'width' value
   */
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /**
   * Show a loading spinner on button
   */
  loading: PropTypes.bool,
};

StyledButton.defaultProps = {
  blacklist: tag.defaultProps.blacklist.concat('buttonStyle', 'buttonSize'),
  buttonSize: 'medium',
  buttonStyle: 'standard',
  loading: false,
};

/** @component */
export default StyledButton;

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
  maxWidth,
  space,
  textAlign,
  width,
} from 'styled-system';
import { buttonSize, buttonStyle } from '../constants/theme';

/**
 * styled-component button using styled-system
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledButton = styled(tag.button)`
  appearance: none;
  border: none;
  cursor: pointer;

  ${bgColor}
  ${border}
  ${borderRadius}
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontWeight}
  ${maxWidth}
  ${space}
  ${textAlign}
  ${width}

  ${buttonStyle}
  ${buttonSize}
`;

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
   * From styled-system: accepts any css 'max-width' value
   */
  maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /**
   * From styled-system: accepts any css 'text-align' value
   */
  textAlign: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /**
   * From styled-system: accepts any css 'width' value
   */
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
};

StyledButton.defaultProps = {
  blacklist: tag.defaultProps.blacklist.concat('buttonStyle', 'buttonSize'),
  buttonSize: 'medium',
  buttonStyle: 'standard',
};

/** @component */
export default StyledButton;

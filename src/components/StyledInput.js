import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  background,
  borders,
  borderColor,
  borderRadius,
  color,
  display,
  flex,
  fontSize,
  fontWeight,
  maxWidth,
  minWidth,
  space,
  textAlign,
  themeGet,
  width,
  height,
  lineHeight,
} from 'styled-system';
import tag from 'clean-tag';
import { overflow } from '../lib/styled_system_custom';
import { buttonSize, buttonStyle } from '../constants/theme';

const getBorderColor = ({ error, success }) => {
  if (error) {
    return themeGet('colors.red.500');
  }

  if (success) {
    return themeGet('colors.green.300');
  }

  return themeGet('colors.black.300');
};

/**
 * styled-component input tag using styled-system
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledInput = styled(tag.input)`
  ${background}
  ${borders}
  ${borderColor}
  ${borderRadius}
  ${color}
  ${display}
  ${flex}
  ${fontSize}
  ${fontWeight}
  ${lineHeight}
  ${maxWidth}
  ${minWidth}
  ${overflow}
  ${space}
  ${textAlign}
  ${width}
  ${height}

  border-color: ${getBorderColor};
  border-style: ${props => (props.bare ? 'none' : 'solid')};
  box-sizing: border-box;
  outline: none;

  &:disabled {
    background-color: ${themeGet('colors.black.50')};
    cursor: not-allowed;
  }

  &:focus, &:hover:not(:disabled) {
    border-color: ${themeGet('colors.primary.300')};
  }

  &::placeholder {
    color: ${themeGet('colors.black.400')};
  }
`;

StyledInput.propTypes = {
  /** @ignore */
  blacklist: PropTypes.arrayOf(PropTypes.string),
  /** true to hide styled borders */
  bare: PropTypes.bool,
  /** styled-system prop: accepts any css 'border' value */
  border: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'border-color' value */
  borderColor: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'border-radius' value */
  borderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** Show disabled state for field */
  disabled: PropTypes.bool,
  /** Show error state for field */
  error: PropTypes.bool,
  /** styled-system prop: accepts any css 'font-size' value */
  fontSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'min-width' value */
  maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'max-width' value */
  minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** @ignore */
  px: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** @ignore */
  py: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /**
   * styled-system prop: adds margin & padding props
   * see: https://github.com/jxnblk/styled-system/blob/master/docs/api.md#space
   */
  space: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** Show success state for field */
  success: PropTypes.bool,
  /** styled-system prop: accepts any css 'width' value */
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
};

StyledInput.defaultProps = {
  blacklist: tag.defaultProps.blacklist.concat('buttonStyle', 'buttonSize', 'bare', 'error'),
  border: '1px solid',
  borderColor: 'black.300',
  borderRadius: '4px',
  px: 3,
  py: 2,
  lineHeight: '1.5',
  fontSize: 'Paragraph',
};

export const TextInput = styled(StyledInput)``;

TextInput.defaultProps = {
  ...StyledInput.defaultProps,
  type: 'text',
};

export const SubmitInput = styled(StyledInput)`
  ${buttonStyle};
  ${buttonSize};
`;

SubmitInput.defaultProps = {
  blacklist: tag.defaultProps.blacklist.concat('buttonStyle', 'buttonSize', 'bare'),
  buttonStyle: 'primary',
  buttonSize: 'large',
  fontWeight: 'bold',
  type: 'submit',
};

/** @component */
export default StyledInput;

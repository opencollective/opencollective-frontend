import PropTypes from 'prop-types';
import propTypes from '@styled-system/prop-types';
import themeGet from '@styled-system/theme-get';
import styled, { css } from 'styled-components';
import { background, border, color, flexbox, layout, space, typography } from 'styled-system';

import { overflow } from '../lib/styled-system-custom-properties';
import { buttonSize, buttonStyle } from '../lib/theme/variants/button';

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
const StyledInput = styled.input`
  ${background}
  ${border}
  ${color}
  ${layout}
  ${flexbox}
  ${typography}
  ${overflow}
  ${space}

  border-color: ${getBorderColor};
  border-style: ${props => (props.bare ? 'none' : 'solid')};
  box-sizing: border-box;
  outline: none;
  background-color: ${themeGet('colors.white.full')};

  ${props => {
    if (props.withOutline) {
      return props.error
        ? css`
            outline: 1px dashed ${themeGet('colors.red.300')};
            outline-offset: 0.2em;
          `
        : css`
            &:focus {
              outline: 1px dashed ${themeGet('colors.black.200')};
              outline-offset: 0.2em;
            }
          `;
    }
  }}

  &[type=radio] {
    cursor: pointer;
  }

  &:disabled {
    background-color: ${themeGet('colors.black.50')};
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    border-color: ${themeGet('colors.primary.300')};
  }

  &:focus:not(:disabled) {
    border-color: ${themeGet('colors.primary.500')};
  }

  &::placeholder {
    color: ${themeGet('colors.black.400')};
  }

  &[type='date'] {
    font-family: inherit;
  }
`;

StyledInput.propTypes = {
  /** Show success state for field */
  success: PropTypes.bool,
  /** true to hide styled borders */
  bare: PropTypes.bool,
  /** if true, a default outline will be displayed when focused */
  withOutline: PropTypes.bool,
  /** Scroll overflow */
  overflow: PropTypes.oneOf(['auto', 'hidden', 'scroll']),
  // Styled-system proptypes
  ...propTypes.background,
  ...propTypes.border,
  ...propTypes.color,
  ...propTypes.flexbox,
  ...propTypes.layout,
  ...propTypes.space,
  ...propTypes.typography,
};

StyledInput.defaultProps = {
  border: '1px solid',
  borderColor: 'black.300',
  borderRadius: '4px',
  px: 3,
  py: 2,
  lineHeight: '1.5',
  fontSize: '14px',
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
  buttonStyle: 'primary',
  buttonSize: 'large',
  fontWeight: 'bold',
  type: 'submit',
};

/** @component */
export default StyledInput;

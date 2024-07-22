import { themeGet } from '@styled-system/theme-get';
import styled, { css } from 'styled-components';
import type {
  BackgroundProps,
  BorderProps,
  ColorProps,
  FlexboxProps,
  LayoutProps,
  SpaceProps,
  TypographyProps,
} from 'styled-system';
import { background, border, color, flexbox, layout, space, typography } from 'styled-system';

import { overflow } from '../lib/styled-system-custom-properties';

const getBorderColor = ({ error = undefined, success = undefined }) => {
  if (error) {
    return themeGet('colors.red.500');
  }

  if (success) {
    return themeGet('colors.green.300');
  }

  return themeGet('colors.black.300');
};

export type StyledInputProps = BackgroundProps &
  BorderProps &
  ColorProps &
  FlexboxProps &
  LayoutProps &
  SpaceProps &
  TypographyProps &
  React.InputHTMLAttributes<HTMLInputElement> & {
    /** Show success state for field */
    success?: boolean;
    error?: boolean;
    /** true to hide styled borders */
    bare?: boolean;
    /** if true, a default outline will be displayed when focused */
    withOutline?: boolean;
    /** Scroll overflow */
    overflow?: 'auto' | 'hidden' | 'scroll';
    /** if true, hide spinners for number inputs */
    hideSpinners?: boolean;
  };

/**
 * styled-component input tag using styled-system
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledInput = styled.input.attrs<StyledInputProps>(props => ({
  border: props.border ?? '1px solid',
  borderColor: props.borderColor ?? 'black.300',
  borderRadius: props.borderRadius ?? '4px',
  px: props.px ?? 3,
  py: props.py ?? 2,
  lineHeight: props.lineHeight ?? '1.5',
  fontSize: props.fontSize ?? '14px',
}))<StyledInputProps>`
  &:not([type='checkbox']):not([type='radio']):not([type='range']) {
    min-height: ${props => props.minHeight || '36px'};
  }

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
  max-width: none;

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

  ${props =>
    props.hideSpinners &&
    css`
      ::-webkit-inner-spin-button,
      ::-webkit-outer-spin-button {
        -webkit-appearance: none;
        -moz-appearance: textfield;
        margin: 0;
      }

      &[type='number'] {
        appearance: none;
        -moz-appearance: textfield;
      }
    `}

  &[type=radio] {
    cursor: pointer;
  }

  &[type='range'] {
    cursor: grabbing;
  }

  &:disabled {
    background-color: ${themeGet('colors.black.50')};
    cursor: not-allowed;
    color: ${themeGet('colors.black.400')};
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

/** @component */
export default StyledInput;

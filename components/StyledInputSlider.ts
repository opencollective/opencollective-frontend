import { get } from 'lodash';
import styled, { css } from 'styled-components';

import type { StyledInputProps } from './StyledInput';
import StyledInput from './StyledInput';

type StyledInputSliderProps = React.InputHTMLAttributes<HTMLInputElement> & StyledInputProps;

const StyledInputSlider = styled(StyledInput).attrs<StyledInputSliderProps>(props => ({
  type: 'range',
  color: props.color ?? 'primary.600',
  backgroundColor: props.backgroundColor ?? 'black.200',
}))<StyledInputSliderProps>`
  /** Reset styles */
  -webkit-appearance: none;
  padding: 0;
  font: inherit;
  outline: none;
  box-sizing: border-box;
  cursor: pointer;

  /** Custom styles for the track */
  border-radius: 8px;
  height: 4px;

  /** Custom styles for the slider */
  ${props => {
    const color = get(props.theme, `colors.${props.color}`) || props.color;
    return css`
      /*Chrome*/
      @media screen and (-webkit-min-device-pixel-ratio: 0) {
        &::-webkit-slider-thumb {
          border-radius: 100%;
          height: 14px;
          width: 14px;
        }
        /** FF*/
        &::-moz-range-thumb {
          border-radius: 100%;
          height: 14px;
          width: 14px;
        }
        /* IE*/
        &::-ms-fill-lower {
          border-radius: 100%;
          height: 14px;
          width: 14px;
        }
      }

      /** Change thumb color only when not disabled */
      &:not(:disabled) {
        /*Chrome*/
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          &::-webkit-slider-thumb {
            -webkit-appearance: none;
            background: ${color};
            border: 1px solid ${color};
          }
        }
        /** FF*/
        &::-moz-range-thumb {
          background-color: ${color};
          border: 1px solid ${color};
        }
        /* IE*/
        &::-ms-fill-lower {
          background-color: ${color};
          border: 1px solid ${color};
        }
      }
    `;
  }}
`;

export default StyledInputSlider;

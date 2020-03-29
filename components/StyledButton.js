import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { border, color, layout, typography, space, flexbox, background } from 'styled-system';

import { textTransform } from '../lib/styled-system-custom-properties';
import { buttonSize, buttonStyle } from '../lib/theme/variants/button';
import StyledSpinner from './StyledSpinner';
import theme from '../lib/theme';

/**
 * styled-component button using styled-system
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledButtonContent = styled.button`
  appearance: none;
  border: none;
  cursor: pointer;
  outline: 0;
  border: 1px solid;
  border-radius: 100px;
  letter-spacing: -0.4px;
  font-weight: 500;
  
  &:disabled {
    cursor: not-allowed;
  }

  /** Align button icons in the middle */
  svg {
    vertical-align: middle;
  }

  /** Variants */
  ${buttonStyle}
  ${buttonSize}

  /** Styled-system */
  ${border}
  ${color}
  ${background}
  ${flexbox}
  ${space}
  ${layout}
  ${typography}
  ${textTransform}

  /** Special prop to render borderless */
  ${props => {
    if (props.asLink || props.isBorderless) {
      const baseActiveStyles = props.theme.buttons[props.buttonStyle]['&:active'];

      return css`
        background: transparent;
        background-color: transparent;
        border: 1px solid transparent !important;

        &:hover:not(:disabled):not(:active) {
          background: ${props.theme.colors.black[50]};
          background-color: ${props.theme.colors.black[50]};
        }

        &:active {
          color: ${baseActiveStyles.color};
          background: ${baseActiveStyles.background};
          background-color: ${baseActiveStyles.backgroundColor};
        }
      `;
    }
  }}
`;

const StyledButton = ({ loading, ...props }) =>
  !loading ? (
    <StyledButtonContent {...props} />
  ) : (
    <StyledButtonContent {...props} onClick={undefined}>
      <StyledSpinner />
    </StyledButtonContent>
  );

StyledButton.propTypes = {
  /**
   * Based on the design system theme
   */
  buttonSize: PropTypes.oneOf(Object.keys(theme.buttonSizes)),
  /**
   * Based on the design system theme
   */
  buttonStyle: PropTypes.oneOf(Object.keys(theme.buttons)),
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
  /**
   * @deprecated Please use `isBorderless`
   * If true, will display a link instead of a button
   */
  asLink: PropTypes.bool,
  /**
   * If true, will display a link instead of a button
   */
  isBorderless: PropTypes.bool,
};

StyledButton.defaultProps = {
  buttonSize: 'medium',
  buttonStyle: 'standard',
  loading: false,
};

/** @component */
export default StyledButton;

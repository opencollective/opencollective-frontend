import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { border, color, layout, typography, space, flexbox } from 'styled-system';
import themeGet from '@styled-system/theme-get';
import { get } from 'lodash';

import { textTransform } from '../lib/styled-system-custom-properties';
import { buttonSize, buttonStyle } from '../lib/theme/variants/button';
import StyledSpinner from './StyledSpinner';

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

  &:focus {
    box-shadow: 0px 0px 0px 1px #90F0BD;
  }

  &:disabled {
    cursor: not-allowed;
  }

  /** Align button icons in the middle */
  svg {
    vertical-align: middle;
  }

  ${buttonStyle}
  ${buttonSize}

  ${props =>
    props.asLink &&
    css`
      background: none !important;
      color: inherit;
      border: none;
      padding: 0;
      font: inherit;
      color: ${themeGet('colors.primary.500')};

      &:active {
        color: ${themeGet('colors.primary.400')};
      }

      &:focus {
        box-shadow: 0 0 0 1px ${props => get(props.theme.colors, props.focusColor) || props.theme.colors.primary['300']};
      }
    `}

  ${border}
  ${color}
  ${flexbox}
  ${space}
  ${layout}
  ${typography}
  ${textTransform}
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
  buttonSize: PropTypes.oneOf(['small', 'medium', 'large']),
  /**
   * Based on the design system theme
   */
  buttonStyle: PropTypes.oneOf(['primary', 'secondary', 'standard', 'dark', 'danger', 'success']),
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
  /** If true, will display a link instead of a button */
  asLink: PropTypes.bool,
};

StyledButton.defaultProps = {
  buttonSize: 'medium',
  buttonStyle: 'standard',
  loading: false,
};

/** @component */
export default StyledButton;

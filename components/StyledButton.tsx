import React from 'react';
import PropTypes from 'prop-types';
import StyledSystemPropTypes from '@styled-system/prop-types';
import type { ForwardRefExoticComponent } from 'react';
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

import type { TextTransformProps, WhiteSpaceProps } from '../lib/styled-system-custom-properties';
import { textTransform, whiteSpace } from '../lib/styled-system-custom-properties';
import theme from '../lib/theme';
import type { ButtonSize, ButtonStyle } from '../lib/theme/variants/button';
import { buttonSize, buttonStyle } from '../lib/theme/variants/button';

import StyledSpinner from './StyledSpinner';

export type StyledButtonProps = BackgroundProps &
  BorderProps &
  FlexboxProps &
  LayoutProps &
  SpaceProps &
  TypographyProps &
  ColorProps &
  TextTransformProps &
  WhiteSpaceProps &
  Omit<React.HTMLProps<HTMLButtonElement>, 'as'> & {
    buttonStyle?: ButtonStyle;
    buttonSize?: ButtonSize;
    loading?: boolean;
    asLink?: boolean;
    isBorderless?: boolean;
    type?: 'button' | 'submit' | 'reset';
    truncateOverflow?: boolean;
    as?: any;
    'data-cy'?: string;
  };

/**
 * styled-component button using styled-system
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledButtonContent = styled.button<StyledButtonProps>`
  appearance: none;
  border: none;
  cursor: pointer;
  outline: 0;
  border: 1px solid;
  border-radius: 100px;
  letter-spacing: -0.4px;
  font-weight: 500;
  min-width: max-content;

  &:disabled {
    cursor: not-allowed;
  }

  &:focus {
    box-shadow: 0px 0px 0px 2px #050505;
  }

  /** Align button icons in the middle */
  span,
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
  ${whiteSpace}

  /** Special prop to render borderless */
  ${props => {
    if (props.asLink || props.isBorderless) {
      const baseActiveStyles = props.theme.buttons[props.buttonStyle]?.['&:active'] || {};

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

  ${props =>
    props.truncateOverflow &&
    css`
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      min-width: 0;
    `}
`;

const StyledButton: ForwardRefExoticComponent<StyledButtonProps> = React.forwardRef<
  HTMLButtonElement,
  StyledButtonProps
>(({ loading, as, ...props }, ref) =>
  // TODO(Typescript): We have to hack the `as` prop because styled-components somehow types it as "never"
  !loading ? (
    <StyledButtonContent {...props} as={as as never} ref={ref} />
  ) : (
    <StyledButtonContent {...props} as={as as never} onClick={undefined} ref={ref}>
      <StyledSpinner size="0.9em" />
    </StyledButtonContent>
  ),
);

StyledButton.displayName = 'StyledButton';

StyledButton.propTypes = {
  ...StyledSystemPropTypes.background,
  ...StyledSystemPropTypes.border,
  ...StyledSystemPropTypes.color,
  ...StyledSystemPropTypes.flexbox,
  ...StyledSystemPropTypes.layout,
  ...StyledSystemPropTypes.space,
  ...StyledSystemPropTypes.typography,
  /**
   * Based on the design system theme
   */
  buttonSize: PropTypes.oneOfType([
    PropTypes.oneOf(Object.keys(theme.buttonSizes)),
    PropTypes.arrayOf(PropTypes.oneOf(Object.keys(theme.buttonSizes))),
  ]),
  /**
   * Based on the design system theme
   */
  buttonStyle: PropTypes.oneOfType([
    PropTypes.oneOf(Object.keys(theme.buttons)),
    PropTypes.arrayOf(PropTypes.oneOf(Object.keys(theme.buttons))),
  ]),
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
  truncateOverflow: PropTypes.bool,
  children: PropTypes.node,
};

StyledButton.defaultProps = {
  buttonSize: 'medium',
  buttonStyle: 'standard',
  loading: false,
};

/** @component */
export default StyledButton;

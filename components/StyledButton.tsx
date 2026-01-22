import React from 'react';
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

import { mergeRefs } from '../lib/react-utils';
import { defaultShouldForwardProp } from '../lib/styled_components_utils';
import type { TextTransformProps, WhiteSpaceProps } from '../lib/styled-system-custom-properties';
import { textTransform, whiteSpace } from '../lib/styled-system-custom-properties';
import type { ButtonSize, ButtonStyle } from '../lib/theme/variants/button';
import { buttonSize, buttonStyle } from '../lib/theme/variants/button';

import Spinner from './Spinner';

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
    as?: React.ElementType;
    'data-cy'?: string;
  };

const FILTERED_PROPS = new Set(['buttonStyle', 'buttonSize', 'loading', 'asLink', 'isBorderless', 'truncateOverflow']);

/**
 * styled-component button using styled-system
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledButtonContent = styled.button.withConfig({
  shouldForwardProp: (prop, target) => defaultShouldForwardProp(prop, target) && !FILTERED_PROPS.has(prop),
})<StyledButtonProps>`
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

/**
 * @deprecated Use `ui/Button` instead
 */
const StyledButton: ForwardRefExoticComponent<StyledButtonProps> = React.forwardRef<
  HTMLButtonElement,
  StyledButtonProps
>(({ loading = false, as = null, buttonSize = 'medium', buttonStyle = 'standard', ...props }, ref) => {
  const internalRef = React.useRef<HTMLButtonElement>(null);
  const allRefs = mergeRefs([ref, internalRef]);
  const baseSize = React.useMemo(() => {
    if (loading) {
      return {
        width: internalRef.current?.offsetWidth,
        height: internalRef.current?.offsetHeight,
      };
    }
  }, [loading]);

  // TODO(Typescript): We have to hack the `as` prop because styled-components somehow types it as "never"
  return !loading ? (
    <StyledButtonContent buttonSize={buttonSize} buttonStyle={buttonStyle} {...props} as={as as never} ref={allRefs} />
  ) : (
    <StyledButtonContent
      {...props}
      as={as as never}
      buttonSize={buttonSize}
      buttonStyle={buttonStyle}
      width={props.width ?? props.size ?? baseSize?.width}
      height={props.height ?? props.size ?? baseSize?.height}
      onClick={undefined}
      type="button"
      ref={allRefs}
    >
      <Spinner size="0.9em" />
    </StyledButtonContent>
  );
});

StyledButton.displayName = 'StyledButton';

/** @component */
export default StyledButton;

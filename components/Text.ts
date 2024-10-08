import type React from 'react';
import type { CSSProp } from 'styled-components';
import styled, { css } from 'styled-components';
import type { ColorProps, DisplayProps, SpaceProps, TypographyProps } from 'styled-system';
import { color, display, space, typography } from 'styled-system';

import type {
  CursorProps,
  OverflowWrapProps,
  TextTransformProps,
  WhiteSpaceProps,
  WordBreakProps,
} from '../lib/styled-system-custom-properties';
import { cursor, overflowWrap, textTransform, whiteSpace, wordBreak } from '../lib/styled-system-custom-properties';

type TextProps = ColorProps &
  DisplayProps &
  SpaceProps &
  TypographyProps &
  TextTransformProps &
  WhiteSpaceProps &
  OverflowWrapProps &
  WordBreakProps &
  CursorProps & {
    truncateOverflow?: boolean;
    css?: CSSProp;
  };

const CUSTOM_TEXT_PROPS = new Set(['fontSize', 'letterSpacing', 'textDecoration', 'whiteSpace']);

export const P = styled.p
  .withConfig({
    shouldForwardProp: (prop, validate) => validate(prop) && !CUSTOM_TEXT_PROPS.has(prop),
  })
  .attrs<TextProps>(props => ({
    // Overrides default margin Y to avoid global styles
    mb: props.mb || props.my || props.m || 0,
    mt: props.mt || props.my || props.m || 0,
    fontSize: props.fontSize ?? '14px',
    letterSpacing: props.letterSpacing ?? '-0.4px',
    lineHeight: props.lineHeight ?? '1.15em',
  }))<TextProps & React.HTMLProps<HTMLParagraphElement>>`
  ${color}
  ${display}
  ${space}
  ${typography}
  ${textTransform}
  ${whiteSpace}
  ${overflowWrap}
  ${wordBreak}
  ${cursor}
  ${props =>
    props.truncateOverflow &&
    css`
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    `}
`;

export const Span = styled(P).attrs<TextProps & React.HTMLProps<HTMLSpanElement>>(props => ({
  as: props.as ?? 'span',
  fontSize: props.fontSize ?? 'inherit',
  lineHeight: props.lineHeight ?? 'inherit',
}))<TextProps>``;

export const Label = styled(P).attrs<TextProps & React.HTMLProps<HTMLLabelElement>>(props => ({
  as: props.as ?? 'label',
  fontWeight: props.fontWeight ?? 'normal',
}))<TextProps>``;

export const Strong = styled(P).attrs<TextProps & React.HTMLProps<HTMLSpanElement>>(props => ({
  as: props.as ?? 'strong',
  fontWeight: props.fontWeight ?? 'bold',
}))<TextProps>``;

export const H1 = styled(P).attrs<TextProps & React.HTMLProps<HTMLHeadingElement>>(props => ({
  as: props.as ?? 'h1',
  fontSize: props.fontSize ?? '52px',
  fontWeight: props.fontWeight ?? 'bold',
  letterSpacing: props.letterSpacing ?? '-1.2px',
  lineHeight: props.lineHeight ?? '56px',
  textAlign: props.textAlign ?? 'left',
}))<TextProps>``;

export const H2 = styled(P).attrs<TextProps & React.HTMLProps<HTMLHeadingElement>>(props => ({
  as: props.as ?? 'h2',
  fontSize: props.fontSize ?? '40px',
  fontWeight: props.fontWeight ?? 'bold',
  letterSpacing: props.letterSpacing ?? '-0.4px',
  lineHeight: props.lineHeight ?? '44px',
}))<TextProps>``;

export const H3 = styled(P).attrs<TextProps & React.HTMLProps<HTMLHeadingElement>>(props => ({
  as: props.as ?? 'h3',
  fontSize: props.fontSize ?? '32px',
  fontWeight: props.fontWeight ?? 'bold',
  letterSpacing: props.letterSpacing ?? '-0.4px',
  lineHeight: props.lineHeight ?? '36px',
}))<TextProps>``;

export const H4 = styled(P).attrs<TextProps & React.HTMLProps<HTMLHeadingElement>>(props => ({
  as: props.as ?? 'h4',
  fontSize: props.fontSize ?? '24px',
  fontWeight: props.fontWeight ?? 'bold',
  letterSpacing: props.letterSpacing ?? '-0.4px',
  lineHeight: props.lineHeight ?? '32px',
}))<TextProps>``;

export const H5 = styled(P).attrs<TextProps & React.HTMLProps<HTMLHeadingElement>>(props => ({
  as: props.as ?? 'h5',
  fontSize: props.fontSize ?? '20px',
  fontWeight: props.fontWeight ?? 500,
  letterSpacing: props.letterSpacing ?? '-0.4px',
  lineHeight: props.lineHeight ?? '24px',
  color: props.color ?? 'black.900',
}))<TextProps>``;

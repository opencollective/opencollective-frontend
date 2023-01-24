/**
 * This file bundle custom `styled-system` css properties adapters that are not
 * included in the library. If a property in this file is made available in the
 * library, it should be removed from here.
 */

import { style } from 'styled-system';

export const textDecoration = style({ prop: 'textDecoration' });
export type TextDecorationProps = { textDecoration?: string };

export const textTransform = style({ prop: 'textTransform' });
export type TextTransformProps = { textTransform?: 'capitalize' | 'lowercase' | 'uppercase' | 'none' };

export const whiteSpace = style({ prop: 'whiteSpace' });
type WhiteSpaceValues = 'normal' | 'nowrap' | 'pre' | 'pre-line' | 'pre-wrap' | 'initial' | 'inherit';
export type WhiteSpaceProps = { whiteSpace?: WhiteSpaceValues };

export const wordBreak = style({ prop: 'wordBreak' });
export type WordBreakProps = { wordBreak?: 'normal' | 'break-all' | 'keep-all' | 'break-word' | 'initial' | 'inherit' };

export const overflowWrap = style({ prop: 'overflowWrap' });
export type OverflowWrapProps = { overflowWrap?: 'normal' | 'anywhere' | 'break-word' | 'initial' | 'inherit' };

export const cursor = style({ prop: 'cursor' });
export type CursorProps = { cursor?: string };

export const overflow = style({ prop: 'overflow' });
export type OverflowProps = { overflow?: 'visible' | 'hidden' | 'scroll' | 'auto' | 'initial' | 'inherit' };

export const resize = style({ prop: 'resize' });
export type ResizeProps = { resize?: 'none' | 'both' | 'horizontal' | 'vertical' | 'initial' | 'inherit' };

export const pointerEvents = style({ prop: 'pointerEvents' });
export type PointerEventsProps = { pointerEvents?: 'auto' | 'none' | 'initial' | 'inherit' };

export const float = style({ prop: 'float' });
export type FloatProps = { float?: 'left' | 'right' | 'none' | 'initial' | 'inherit' };

export const clear = style({ prop: 'clear' });
export type ClearProps = { clear?: 'left' | 'right' | 'both' | 'none' | 'initial' | 'inherit' };

export const listStyle = style({ prop: 'listStyle' });
export type ListStyleProps = { listStyle?: string };

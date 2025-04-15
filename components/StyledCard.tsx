import styledPropTypes from '@styled-system/prop-types';
import styled from 'styled-components';
import type {
  BackgroundProps,
  BorderProps,
  ColorProps,
  FlexboxProps,
  LayoutProps,
  PositionProps,
  ShadowProps,
  SpaceProps,
  TypographyProps,
} from 'styled-system';
import {
  background,
  border,
  color,
  compose,
  flexbox,
  layout,
  position,
  shadow,
  space,
  typography,
} from 'styled-system';

type StyledCardProps = BackgroundProps &
  BorderProps &
  FlexboxProps &
  LayoutProps &
  PositionProps &
  SpaceProps &
  TypographyProps &
  ShadowProps &
  ColorProps;

/**
 * A simple styled-component to contain content in a card UI using styled-system.
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 * @deprecated Use `ui/Card` instead
 */
const StyledCard = styled.div.attrs<StyledCardProps>(props => ({
  bg: props.bg ?? 'white.full',
  borderWidth: props.borderWidth ?? '1px',
  borderStyle: props.borderStyle ?? 'solid',
  borderColor: props.borderColor ?? 'black.300',
  borderRadius: props.borderRadius ?? '8px',
  overflowX: props.overflowX ?? 'hidden',
  overflowY: props.overflowY ?? 'hidden',
}))<StyledCardProps>(compose(flexbox, typography, background, border, shadow, color, layout, position, space));

/** @component */
export default StyledCard;

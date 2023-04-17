import styledPropTypes from '@styled-system/prop-types';
import styled from 'styled-components';
import {
  background,
  BackgroundProps,
  border,
  BorderProps,
  color,
  ColorProps,
  compose,
  flexbox,
  FlexboxProps,
  layout,
  LayoutProps,
  position,
  PositionProps,
  shadow,
  ShadowProps,
  space,
  SpaceProps,
  typography,
  TypographyProps,
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
 */
const StyledCard = styled.div<StyledCardProps>(
  compose(flexbox, typography, background, border, shadow, color, layout, position, space),
);

StyledCard.propTypes = {
  ...styledPropTypes.flexbox,
  ...styledPropTypes.typography,
  ...styledPropTypes.background,
  ...styledPropTypes.border,
  ...styledPropTypes.shadow,
  ...styledPropTypes.color,
  ...styledPropTypes.layout,
  ...styledPropTypes.space,
  ...styledPropTypes.position,
};

StyledCard.defaultProps = {
  bg: 'white.full',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'black.300',
  borderRadius: '8px',
  overflowX: 'hidden',
  overflowY: 'hidden',
};

/** @component */
export default StyledCard;

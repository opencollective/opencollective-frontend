import styledPropTypes from '@styled-system/prop-types';
import styled from 'styled-components';
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

/**
 * A simple styled-component to contain content in a card UI using styled-system.
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledCard = styled.div(compose(flexbox, typography, background, border, shadow, color, layout, position, space));

StyledCard.propTypes = {
  ...styledPropTypes.typography,
  ...styledPropTypes.background,
  ...styledPropTypes.border,
  ...styledPropTypes.shadow,
  ...styledPropTypes.color,
  ...styledPropTypes.layout,
  ...styledPropTypes.space,
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

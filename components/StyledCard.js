import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  compose,
  background,
  border,
  flexbox,
  shadow,
  color,
  layout,
  space,
  typography,
  position,
} from 'styled-system';
import styledPropTypes from '@styled-system/prop-types';
import { overflow } from '../lib/styled-system-custom-properties';

/**
 * A simple styled-component to contain content in a card UI using styled-system.
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledCard = styled.div(
  compose(flexbox, typography, background, border, shadow, color, layout, position, space, overflow),
);

StyledCard.propTypes = {
  ...styledPropTypes.typography,
  ...styledPropTypes.background,
  ...styledPropTypes.border,
  ...styledPropTypes.shadow,
  ...styledPropTypes.color,
  ...styledPropTypes.layout,
  ...styledPropTypes.space,
  /** styled-system prop: accepts any css 'overflow' value */
  overflow: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
};

StyledCard.defaultProps = {
  bg: 'white.full',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'black.300',
  borderRadius: '8px',
  overflow: 'hidden',
};

/** @component */
export default StyledCard;

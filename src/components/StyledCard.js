import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  background,
  borderColor,
  borders,
  borderRadius,
  boxShadow,
  color,
  display,
  height,
  maxHeight,
  maxWidth,
  minHeight,
  minWidth,
} from 'styled-system';
import { Box } from '@rebass/grid';
import { overflow } from './Container';

/**
 * A simple styled-component to contain content in a card UI using styled-system.
 *
 * @see See [styled-system docs](https://github.com/jxnblk/styled-system/blob/master/docs/api.md) for usage of those props
 */
const StyledCard = styled(Box)`
  ${background}
  ${borders}
  ${borderColor}
  ${borderRadius}
  ${boxShadow}
  ${color}
  ${display}
  ${height}
  ${maxHeight}
  ${maxWidth}
  ${minHeight}
  ${minWidth}
  ${overflow}
`;

StyledCard.propTypes = {
  /** styled-system prop: accepts any css 'background' value or theme color */
  bg: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'border-color' value or theme color */
  borderColor: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'border' value */
  borders: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'border-radius' value */
  borderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'box-shadow' value */
  boxShadow: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'color' value */
  color: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'display' value */
  display: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'height' value */
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'max-height' value */
  maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'max-width' value */
  maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'min-height' value */
  minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'min-width' value */
  minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /** styled-system prop: accepts any css 'overflow' value */
  overflow: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  /**
   * styled-system prop: adds margin & padding props
   * see: https://github.com/jxnblk/styled-system/blob/master/docs/api.md#space
   */
  space: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
};

StyledCard.defaultProps = {
  bg: 'white.full',
  border: '1px solid',
  borderColor: 'black.300',
  borderRadius: '8px',
  overflow: 'hidden',
};

/** @component */
export default StyledCard;

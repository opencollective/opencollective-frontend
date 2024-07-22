import PropTypes from 'prop-types';
import { LoaderAlt } from '@styled-icons/boxicons-regular/LoaderAlt';
import styled from 'styled-components';
import type { SpaceProps } from 'styled-system';
import { space } from 'styled-system';

import { rotating } from './StyledKeyframes';

/** A loading spinner using SVG + css animation. */
const StyledSpinner = styled(LoaderAlt).attrs<SpaceProps>(props => ({
  title: props.title ?? 'Loading',
  size: props.size ?? '1em',
}))<SpaceProps>`
  animation: ${rotating} 1s linear infinite;
  ${space}
`;

StyledSpinner.propTypes = {
  /** From styled-icons, this is a convenience for setting both width and height to the same value */
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** A title for accessibility */
  title: PropTypes.string,
};

/** @component */
export default StyledSpinner;

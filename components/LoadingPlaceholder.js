import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';
import { border, layout, space } from 'styled-system';

import { flicker } from './StyledKeyframes';

const AnimateBackground = keyframes`
  0%{ background-position: -100% 0; }
  100%{ background-position: 100% 0; }
`;

/**
 * A loading container that will show an animated block instead of a blank space.
 */
const LoadingPlaceholder = styled.div`
  animation: ${AnimateBackground} 1s linear infinite, ${flicker({ minOpacity: 0.8 })} 1s linear infinite;
  background: linear-gradient(to right, #eee 2%, #ddd 18%, #eee 33%);
  background-size: 200%;
  width: 100%;
  
  ${border}
  ${layout}
  ${space}
`;

LoadingPlaceholder.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

LoadingPlaceholder.defaultProps = {
  height: '100%',
  borderRadius: '2%',
};

/** @component */
export default LoadingPlaceholder;

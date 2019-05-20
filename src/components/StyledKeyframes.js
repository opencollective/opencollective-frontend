/**
 * A set of styled-components keyframes animations
 */

import { keyframes } from 'styled-components';

export const rotating = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const flicker = ({ minOpacity = 0 }) => keyframes`
  0%   { opacity: 1; }
  50%  { opacity: ${minOpacity}; }
  100% { opacity: 1; }
`;

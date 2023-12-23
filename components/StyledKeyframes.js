/**
 * A set of styled-components keyframes animations
 */

import { keyframes } from 'styled-components';

// ignore unused exports

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

export const slideInUp = keyframes`
  from {
    transform: translate3d(0,40px,0);
  }
  to {
    transform: translate3d(0,0,0);
  }
`;

export const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translate3d(0,40px,0);
  }
  to {
    opacity: 1;
    transform: translate3d(0,0,0);
  }
`;

export const fadeInDown = keyframes`
  from {
    opacity: 0;
    transform: translate3d(0,-40px,0);
  }
  to {
    opacity: 1;
    transform: translate3d(0,0,0);
  }
`;

export const flicker = ({ minOpacity = 0 }) => keyframes`
  0%   { opacity: 1; }
  50%  { opacity: ${minOpacity}; }
  100% { opacity: 1; }
`;

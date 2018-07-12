import { css, keyframes } from 'styled-components';

export const rotate = keyframes`
  0%    { transform: rotate(0deg); }
  100%  { transform: rotate(360deg); }
`;

export const rotateMixin = css`
  animation: ${rotate} 0.8s infinite linear;
`;

import type React from 'react';
import styled, { keyframes } from 'styled-components';
import type { BorderProps, LayoutProps, SpaceProps } from 'styled-system';
import { border, layout, space } from 'styled-system';

import { flicker } from './StyledKeyframes';

type LoadingPlaceholderProps = LayoutProps & BorderProps & SpaceProps & React.HTMLProps<HTMLDivElement>;

const AnimateBackground = keyframes`
  0%{ background-position: -100% 0; }
  100%{ background-position: 100% 0; }
`;

/**
 * A loading container that will show an animated block instead of a blank space.
 */
const LoadingPlaceholder = styled.div.attrs<LoadingPlaceholderProps>(props => ({
  height: props.height ?? '100%',
  borderRadius: props.borderRadius ?? '2%',
}))<LoadingPlaceholderProps>`
  animation:
    ${AnimateBackground} 1s linear infinite,
    ${flicker({ minOpacity: 0.8 })} 1s linear infinite;
  background: linear-gradient(to right, #eee 2%, #ddd 18%, #eee 33%);
  background-size: 200%;
  width: 100%;

  ${border}
  ${layout}
  ${space}
`;

/** @component */
export default LoadingPlaceholder;

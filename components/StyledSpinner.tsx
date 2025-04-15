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

/** @component */
export default StyledSpinner;

import { styled } from 'styled-components';

import { defaultShouldForwardProp } from '@/lib/styled_components_utils';

import StyledButton from './StyledButton';

const FILTERED_PROPS = new Set(['textAlign']);

/**
 * A round button with content centered. Accepts all props from `StyledButton`
 *
 * @deprecated Use `ui/Button` with size="icon"
 */
const StyledRoundButton = styled(StyledButton)
  .withConfig({
    shouldForwardProp: (prop, target) => defaultShouldForwardProp(prop, target) && !FILTERED_PROPS.has(prop),
  })
  .attrs(props => ({
    p: 0,
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    size: props.size ?? 42,
  }))`
  line-height: 1;
`;

/** @component */
export default StyledRoundButton;

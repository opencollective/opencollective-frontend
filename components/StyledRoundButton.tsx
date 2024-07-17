import styled from 'styled-components';

import StyledButton from './StyledButton';

/**
 * A round button with content centered. Accepts all props from `StyledButton`
 */
const StyledRoundButton = styled(StyledButton).attrs(props => ({
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

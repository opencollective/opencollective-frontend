import PropTypes from 'prop-types';
import styled from 'styled-components';

import StyledButton from './StyledButton';

/**
 * A round button with content centered. Accepts all props from `StyledButton`
 */
const StyledRoundButton = styled(StyledButton).attrs({
  p: 0,
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})`
  line-height: 1;
`;

StyledRoundButton.propTypes = {
  /** From styled-system: accepts any css 'width' value */
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
};

StyledRoundButton.defaultProps = {
  size: 42,
};

/** @component */
export default StyledRoundButton;

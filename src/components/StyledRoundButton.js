import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import StyledButton from './StyledButton';

/**
 * A round button with content centered. Accepts all props from `StyledButton`
 */
const StyledRoundButton = styled(({ size, ...props }) => (
  <StyledButton display="flex" width={size} height={size} p={0} {...props} />
))`
  justify-content: center;
  align-items: center;
`;

StyledRoundButton.propTypes = {
  /** From styled-system: accepts any css 'width' value */
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
};

StyledRoundButton.defaultProps = {
  size: 42,
};

export default StyledRoundButton;

import React from 'react';
import MaskedInput from 'react-text-mask';

import StyledInput from './StyledInput';

const StyledInputMask = props => <MaskedInput {...props} />;

StyledInputMask.propTypes = {
  ...StyledInput.propTypes,
  ...MaskedInput.propTypes,
};

StyledInputMask.defaultProps = {
  // eslint-disable-next-line react/display-name
  render: (ref, props) => <StyledInput ref={ref} {...props} />,
};

export default StyledInputMask;

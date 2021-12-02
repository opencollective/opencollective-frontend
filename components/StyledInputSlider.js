import React from 'react';
import PropTypes from 'prop-types';

import StyledInput from './StyledInput';

const StyledInputSlider = props => {
  return <StyledInput {...props} type="range" />;
};

StyledInputSlider.propTypes = {};

export default StyledInputSlider;

import React from 'react';
import PropTypes from 'prop-types';

import { H1 } from './Text';

const ErrorComponent = ({ message }) => {
  return (
    <div className="Error">
      <H1 textAlign="center" padding="8rem">
        {message || 'unknown error'}
      </H1>
    </div>
  );
};

ErrorComponent.propTypes = {
  message: PropTypes.string,
};

export default ErrorComponent;

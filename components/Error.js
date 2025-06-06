import React from 'react';

import { H1 } from './Text';

const ErrorComponent = ({ message }) => {
  return (
    <div className="Error">
      <H1 textAlign="center" padding="5rem">
        {message || 'unknown error'}
      </H1>
    </div>
  );
};

export default ErrorComponent;

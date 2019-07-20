import React from 'react';
import PropTypes from 'prop-types';

const ErrorComponent = ({ message }) => {
  return (
    <div className="Error">
      <style jsx>
        {`
          h1 {
            text-align: center;
            padding: 8rem;
          }
        `}
      </style>
      <h1>{message || 'unknown error'}</h1>
    </div>
  );
};

ErrorComponent.propTypes = {
  message: PropTypes.string,
};

export default ErrorComponent;

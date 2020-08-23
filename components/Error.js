import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Error = styled.div`
  h1 {
    text-align: center;
    padding: 8rem;
  }
`;

const ErrorComponent = ({ message }) => {
  return (
    <Error>
      <h1>{message || 'unknown error'}</h1>
    </Error>
  );
};

ErrorComponent.propTypes = {
  message: PropTypes.string,
};

export default ErrorComponent;

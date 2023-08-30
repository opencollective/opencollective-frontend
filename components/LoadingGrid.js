import React from 'react';
import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';

const DotPulseAnimation = keyframes`
  0% {
    opacity: 1;
  } 50% {
    opacity: .2;
  } 100% {
    opacity: 1;
  }
`;

const LoadingGridSVGContainer = styled.svg`
  circle {
    animation: ${DotPulseAnimation} 1s linear infinite;
    &:nth-child(2) {
      animation-delay: 100ms;
    }
    &:nth-child(3) {
      animation-delay: 300ms;
    }
    &:nth-child(4) {
      animation-delay: 600ms;
    }
    &:nth-child(5) {
      animation-delay: 800ms;
    }
    &:nth-child(6) {
      animation-delay: 400ms;
    }
    &:nth-child(7) {
      animation-delay: 700ms;
    }
    &:nth-child(8) {
      animation-delay: 500ms;
    }
    &:nth-child(9) {
      animation-delay: 200ms;
    }
  }
`;

const LoadingGrid = ({ color, size }) => (
  <LoadingGridSVGContainer
    width={size}
    height={size}
    viewBox="0 0 105 105"
    xmlns="http://www.w3.org/2000/svg"
    fill={color}
  >
    <circle cx="12.5" cy="12.5" r="12.5" />
    <circle cx="12.5" cy="52.5" r="12.5" fillOpacity=".5" />
    <circle cx="52.5" cy="12.5" r="12.5" />
    <circle cx="52.5" cy="52.5" r="12.5" />
    <circle cx="92.5" cy="12.5" r="12.5" />
    <circle cx="92.5" cy="52.5" r="12.5" />
    <circle cx="12.5" cy="92.5" r="12.5" />
    <circle cx="52.5" cy="92.5" r="12.5" />
    <circle cx="92.5" cy="92.5" r="12.5" />
  </LoadingGridSVGContainer>
);

LoadingGrid.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
};

LoadingGrid.defaultProps = {
  color: '#3385FF',
  size: 100,
};

export default LoadingGrid;

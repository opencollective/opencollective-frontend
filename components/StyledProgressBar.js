import React from 'react';
import PropTypes from 'prop-types';
import { clamp } from 'lodash';
import styled from 'styled-components';
import { border, color, layout } from 'styled-system';

const BackgroundBar = styled.div`
  position: relative;

  ${layout}
  ${color}
  ${border}
`;

const ProgressBar = styled.div`
  position: absolute;

  ${layout}
  ${color}
  ${border}
`;

/**
 * A progress bar that displays the current advancement.
 */
const StyledProgressBar = ({
  percentage,
  color = 'green.500',
  backgroundColor = 'rgba(9, 10, 10, 0.04)',
  height = 4,
  borderRadius = 16,
}) => {
  return (
    <BackgroundBar bg={backgroundColor} height={height} borderRadius={borderRadius}>
      <ProgressBar width={`${clamp(percentage, 0, 1) * 100}%`} bg={color} height={height} borderRadius={borderRadius} />
    </BackgroundBar>
  );
};

StyledProgressBar.propTypes = {
  /** Current progress, between 0 and 1 */
  percentage: PropTypes.number.isRequired,
  /** Color of the unfilled bar */
  backgroundColor: PropTypes.string,
  /** Color of the filled bar */
  color: PropTypes.string,
  /** Height */
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Border-radius */
  borderRadius: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default StyledProgressBar;

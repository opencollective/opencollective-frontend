import React from 'react';
import { clamp } from 'lodash';
import { styled } from 'styled-components';
import { border, color, layout } from 'styled-system';

import { defaultShouldForwardProp } from '../lib/styled_components_utils';

const BackgroundBar = styled.div.withConfig({
  shouldForwardProp: (prop, target) => defaultShouldForwardProp(prop, target),
})`
  position: relative;

  ${layout}
  ${color}
  ${border}
`;

const ProgressBar = styled.div.withConfig({
  shouldForwardProp: (prop, target) => defaultShouldForwardProp(prop, target),
})`
  position: absolute;

  ${layout}
  ${color}
  ${border}
`;

/**
 * A progress bar that displays the current advancement.
 * @deprecated Use `ui/Progress` instead
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

export default StyledProgressBar;

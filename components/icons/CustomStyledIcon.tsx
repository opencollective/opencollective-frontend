import React from 'react';
import styled from 'styled-components';
import { alignSelf, height, margin, verticalAlign, width } from 'styled-system';

import { cursor } from '../../lib/styled-system-custom-properties';

const StyledSVG = styled.svg`
  display: inline-block;
  vertical-align: middle;
  overflow: hidden;

  ${alignSelf};
  ${height};
  ${width};
  ${cursor};
  ${verticalAlign};
  ${margin};
`;

/**
 * A simple wrapper to export custom icons as styled icons. It mostly mimics the
 * behaviour of styled-icon library, which is working on making a similar component
 * accessible directly from the library (see https://github.com/jacobwgillespie/@styled-icons/issues/477).
 * As soon as it is released, we should transition to styled-icons component
 * to ensure consistency with third-party imported icons.
 */
const CustomStyledIcon = ({ size, ...props }: Parameters<typeof StyledSVG>[0] & { size?: number | string }) => {
  return (
    <StyledSVG
      stroke="currentColor"
      height={size}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
      aria-hidden="true"
      role="img"
      {...props}
    />
  );
};

export default CustomStyledIcon;

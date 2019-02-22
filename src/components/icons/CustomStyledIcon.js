import React from 'react';
import styled from 'styled-components';
import { alignSelf } from 'styled-system';

/**
 * A simple wrapper to export custom icons as styled icons. It mostly mimics the
 * behaviour of styled-icon library, which is working on making a similar component
 * accessible directly from the library (see https://github.com/jacobwgillespie/styled-icons/issues/477).
 * As soon as it is released, we should transition to styled-icons component
 * to ensure consistency with third-party imported icons.
 */
const CustomIcon = ({ size, ...props }) => <svg height={size} width={size} {...props} />;

CustomIcon.defaultProps = {
  focusable: 'false',
  'aria-hidden': 'true',
  role: 'img',
};

const CustomStyledIcon = styled(CustomIcon)`
  display: inline-block;
  vertical-align: middle;
  overflow: hidden;
  ${alignSelf};
`;

export default CustomStyledIcon;

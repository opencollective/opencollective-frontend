import React from 'react';

export const useHover = () => {
  const [isHovered, set] = React.useState(false);
  const elemProps = { onMouseEnter: () => set(true), onMouseLeave: () => set(false) };
  return [isHovered, elemProps];
};

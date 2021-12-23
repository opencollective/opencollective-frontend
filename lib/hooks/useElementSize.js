import React from 'react';

export const useElementSize = ({ defaultWidth = 0, defaultHeight = 0 }) => {
  const ref = React.useRef();
  const [elementSize, setElementSize] = React.useState({ width: defaultWidth, height: defaultHeight });

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setElementSize({ width, height });
    });

    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect();
  }, []);

  return { ref, ...elementSize };
};

import { useEffect, useRef, useState } from 'react';

export const useElementSize = ({ defaultWidth = 0, defaultHeight = 0 }) => {
  const ref = useRef(null);
  const currentRef = ref.current;
  const resizeObserver = useRef(null); // To store the observer instance
  const [elementSize, setElementSize] = useState({
    width: defaultWidth,
    height: defaultHeight,
  });

  useEffect(() => {
    if (!currentRef) {
      return;
    }

    // Create a new observer only if it's not already created
    if (!resizeObserver.current) {
      resizeObserver.current = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        setElementSize({ width, height });
      });
    }

    // Observe the current element
    resizeObserver.current.observe(currentRef);

    return () => {
      if (resizeObserver.current && currentRef) {
        resizeObserver.current.unobserve(currentRef);
      }
    };
  }, [currentRef]);

  return { ref, ...elementSize };
};

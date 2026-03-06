import { useEffect, useRef, useState } from 'react';

export const useElementSize = ({ defaultWidth = 0, defaultHeight = 0 }) => {
  const ref = useRef(null);
  const resizeObserver = useRef(null); // To store the observer instance
  const [elementSize, setElementSize] = useState({
    width: defaultWidth,
    height: defaultHeight,
  });

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    if (typeof setImmediate !== 'undefined' && ref.current) {
      if (!defaultWidth && !defaultHeight) {
        setImmediate(() => setElementSize({ width: ref.current.clientWidth, height: ref.current.clientHeight }));
      }
    }

    // Create a new observer only if it's not already created
    if (!resizeObserver.current) {
      resizeObserver.current = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        setElementSize({ width, height });
      });
    }

    // Observe the current element
    resizeObserver.current.observe(ref.current);
    const refCurrent = ref.current; // Store the current ref for cleanup

    return () => {
      if (resizeObserver.current && refCurrent) {
        resizeObserver.current.unobserve(refCurrent);
      }
    };
  }, [defaultHeight, defaultWidth]);

  return { ref, ...elementSize };
};

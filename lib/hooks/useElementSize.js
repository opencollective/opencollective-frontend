import { useCallback, useEffect, useRef, useState } from 'react';

export const useElementSize = ({ defaultWidth = 0, defaultHeight = 0 }) => {
  const elementRef = useRef(null);
  const resizeObserver = useRef(null);
  const [elementSize, setElementSize] = useState({
    width: defaultWidth,
    height: defaultHeight,
  });
  const [observedNode, setObservedNode] = useState(null);

  const ref = useCallback(node => {
    elementRef.current = node;
    setObservedNode(node);
  }, []);

  useEffect(() => {
    const currentRef = observedNode;
    if (!currentRef) {
      return;
    }

    if (!resizeObserver.current) {
      resizeObserver.current = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        setElementSize({ width, height });
      });
    }

    resizeObserver.current.observe(currentRef);

    return () => {
      if (resizeObserver.current && currentRef) {
        resizeObserver.current.unobserve(currentRef);
      }
    };
  }, [observedNode]);

  return { ref, ...elementSize };
};

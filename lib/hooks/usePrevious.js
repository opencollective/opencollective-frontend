import { useEffect, useRef } from 'react';

/**
 * Holds the previous value. Useful to reproduce a `componentDidUpdate(prevProps)` behavior
 * in a hook component.
 */
export const usePrevious = value => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

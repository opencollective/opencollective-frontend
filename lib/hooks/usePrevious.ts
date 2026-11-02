import React from 'react';

/**
 * Holds the previous value. Useful to reproduce a `componentDidUpdate(prevProps)` behavior
 * in a hook component.
 */
export const usePrevious = <T>(value: T): T => {
  const ref = React.useRef<T>(null);

  React.useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

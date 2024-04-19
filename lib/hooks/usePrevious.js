import React from 'react';

/**
 * Holds the previous value. Useful to reproduce a `componentDidUpdate(prevProps)` behavior
 * in a hook component.
 */
export const usePrevious = value => {
  const ref = React.useRef();

  React.useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

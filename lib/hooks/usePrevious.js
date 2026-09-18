import React from 'react';

/**
 * Holds the previous value. Useful to reproduce a `componentDidUpdate(prevProps)` behavior
 * in a hook component.
 */
export const usePrevious = value => {
  const [state, setState] = React.useState({ value, previous: null });

  if (value !== state.value) {
    setState({ value, previous: state.value });
  }

  return state.previous;
};

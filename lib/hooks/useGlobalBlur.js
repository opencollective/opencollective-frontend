import React from 'react';

const useGlobalBlur = (ref, callback, closingEvent = 'mousedown') => {
  const wasOutside = e => {
    const currentRef = ref instanceof HTMLElement ? ref : ref?.current;
    callback(!currentRef?.contains(e.target));
  };

  React.useEffect(() => {
    document.addEventListener(closingEvent, wasOutside, false);
    return () => document.removeEventListener(closingEvent, wasOutside, false);
  });
};

export default useGlobalBlur;

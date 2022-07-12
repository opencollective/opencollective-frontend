import React from 'react';

const useGlobalBlur = (ref, callback, closingEvents = ['mousedown']) => {
  const wasOutside = e => {
    const currentRef = ref instanceof HTMLElement ? ref : ref?.current;
    callback(!currentRef?.contains(e.target));
  };

  React.useEffect(() => {
    closingEvents.forEach(closingEvent => document.addEventListener(closingEvent, wasOutside, false));
    return () => closingEvents.forEach(closingEvent => document.removeEventListener(closingEvent, wasOutside, false));
  });
};

export default useGlobalBlur;

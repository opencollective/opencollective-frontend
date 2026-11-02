import React from 'react';

const useGlobalBlur = (
  ref: React.RefObject<HTMLElement> | HTMLElement,
  callback: (isOutside: boolean) => void,
  closingEvents: string[] = ['mousedown'],
) => {
  const wasOutside = (e: MouseEvent) => {
    const currentRef = ref instanceof HTMLElement ? ref : ref?.current;
    callback(!currentRef?.contains(e.target as Node));
  };

  React.useEffect(() => {
    closingEvents.forEach(closingEvent => document.addEventListener(closingEvent, wasOutside, false));
    return () => closingEvents.forEach(closingEvent => document.removeEventListener(closingEvent, wasOutside, false));
  });
};

export default useGlobalBlur;

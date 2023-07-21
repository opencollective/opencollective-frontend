import { useEffect, useState } from 'react';
import { throttle } from 'lodash';

import { BREAKPOINTS, getViewportFromWidth, VIEWPORTS } from '../withViewport';

export { BREAKPOINTS, VIEWPORTS };

export const useWindowResize = (onResizeCallback?) => {
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>(VIEWPORTS.UNKNOWN);
  const callback = (...args) => {
    const newViewport = getViewportFromWidth(window.innerWidth);
    if (newViewport !== viewport) {
      setViewport(newViewport);
    }
    onResizeCallback?.(...args);
  };

  useEffect(() => {
    const debouncedCallback = throttle(callback, 100);
    debouncedCallback();
    window.addEventListener('resize', debouncedCallback);
    return () => window.removeEventListener('resize', debouncedCallback);
  }, []);

  return { viewport };
};

import { useEffect, useState } from 'react';
import { throttle } from 'lodash';

import { BREAKPOINTS, getViewportFromMaxWidth, getViewportFromMinWidth, VIEWPORTS } from '../withViewport';

export { BREAKPOINTS, VIEWPORTS };

export const useWindowResize = (onResizeCallback?, options?: { useMinWidth?: boolean }) => {
  const [viewport, setViewport] = useState<VIEWPORTS>(VIEWPORTS.UNKNOWN);
  const callback = (...args) => {
    const newViewport = (options?.useMinWidth ? getViewportFromMinWidth : getViewportFromMaxWidth)(window.innerWidth);
    setViewport(newViewport);
    onResizeCallback?.(...args);
  };

  useEffect(() => {
    const throttledCallback = throttle(callback, 34);
    throttledCallback();
    window.addEventListener('resize', throttledCallback);
    return () => window.removeEventListener('resize', throttledCallback);
  }, []);

  return { viewport };
};

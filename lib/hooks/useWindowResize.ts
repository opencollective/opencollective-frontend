import { useEffect } from 'react';
import { throttle } from 'lodash';

export const useWindowResize = onResizeCallback => {
  useEffect(() => {
    const debouncedCallback = throttle(onResizeCallback, 100);
    debouncedCallback();
    window.addEventListener('resize', debouncedCallback);
    return () => window.removeEventListener('resize', debouncedCallback);
  }, []);
};

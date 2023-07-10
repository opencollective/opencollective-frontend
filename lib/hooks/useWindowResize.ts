import { useEffect } from 'react';
import { throttle } from 'lodash';

import { BREAKPOINTS } from '../withViewport';

export { BREAKPOINTS };

export const useWindowResize = onResizeCallback => {
  useEffect(() => {
    const debouncedCallback = throttle(onResizeCallback, 100);
    debouncedCallback();
    window.addEventListener('resize', debouncedCallback);
    return () => window.removeEventListener('resize', debouncedCallback);
  }, []);
};

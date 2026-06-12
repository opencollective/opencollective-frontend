import { useCallback, useEffect, useState } from 'react';

import { getFromLocalStorage, setLocalStorage } from '../local-storage';

export default function useLocalStorage<T>(key: string, defaultValue?: T) {
  // Always start with defaultValue to match SSR output and avoid hydration mismatch
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const jsonValue = getFromLocalStorage(key);
    if (jsonValue !== null) {
      setValue(JSON.parse(jsonValue) as T);
    }
  }, [key]);

  const set = useCallback(
    (update: T | ((prevValue: T) => T)) => {
      setValue(prev => {
        const nextValue = update instanceof Function ? update(prev) : update;
        setLocalStorage(key, JSON.stringify(nextValue));
        return nextValue;
      });
    },
    [key],
  );

  return [value, set] as const;
}

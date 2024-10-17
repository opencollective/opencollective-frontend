import { useCallback, useState } from 'react';

import { getFromLocalStorage, setLocalStorage } from '../local-storage';

export default function useLocalStorage<T>(key: string, defaultValue?: T) {
  const get = useCallback((): T => {
    const jsonValue = getFromLocalStorage(key);
    if (jsonValue !== null) {
      return JSON.parse(jsonValue) as T;
    } else {
      return defaultValue;
    }
  }, [key]);

  const [value, setValue] = useState<T>(get);

  const set = useCallback(
    (update: T | ((prevValue: T) => T)) => {
      // Function to determine the next value based on the updater type
      const nextValue = update instanceof Function ? update(value) : update;
      setLocalStorage(key, JSON.stringify(nextValue));
      setValue(nextValue);
    },
    [key, value], // Including value as a dependency to ensure correct updater function behavior
  );

  return [value, set] as const;
}

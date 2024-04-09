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
  }, [key, defaultValue]);

  const [value, setValue] = useState<T>(get);

  const set = useCallback(
    (value: T) => {
      setLocalStorage(key, JSON.stringify(value));
      setValue(value);
    },
    [key],
  );

  return [value, set] as const;
}

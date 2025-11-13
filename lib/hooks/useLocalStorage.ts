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
      setValue(prevValue => {
        const nextValue = update instanceof Function ? update(prevValue) : update;
        setLocalStorage(key, JSON.stringify(nextValue));
        return nextValue;
      });
    },
    [key],
  );

  return [value, set] as const;
}

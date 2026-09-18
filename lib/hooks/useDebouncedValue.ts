import React from 'react';
import { debounce } from 'lodash-es';

export default function useDebouncedValue(
  input: string,
  delay: number,
): { debouncedValue: string; isDebouncing: boolean } {
  const [debouncedValue, setDebouncedValue] = React.useState(input);

  const debouncedInput = React.useRef(
    debounce((value: string) => {
      setDebouncedValue(value);
    }, delay),
  );

  React.useEffect(() => {
    debouncedInput.current(input);

    return () => {
      debouncedInput.current.cancel();
    };
  }, [input, delay]);

  const isDebouncing = typeof window !== 'undefined' && input !== debouncedValue;

  return { debouncedValue, isDebouncing };
}

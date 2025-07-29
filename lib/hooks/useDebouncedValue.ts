import React from 'react';
import { debounce } from 'lodash';

export default function useDebouncedValue(
  input: string,
  delay: number,
): { debouncedValue: string; isDebouncing: boolean } {
  const [debouncedValue, setDebouncedValue] = React.useState(input);
  const [isDebouncing, setIsDebouncing] = React.useState(false);

  const debouncedInput = React.useRef(
    debounce((value: string) => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay),
  );

  React.useEffect(() => {
    setIsDebouncing(true);
    debouncedInput.current(input);

    return () => {
      debouncedInput.current.cancel();
    };
  }, [input, delay]);

  return { debouncedValue, isDebouncing };
}

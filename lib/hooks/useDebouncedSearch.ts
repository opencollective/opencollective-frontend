import React from 'react';
import { debounce } from 'lodash-es';

export default function useDebouncedSearch(
  searchFunc: ((v: string) => void) | undefined,
  input: string,
  opts: {
    delay?: number;
    noDelayEmpty?: boolean;
  },
): { isDebouncing: boolean } {
  const [completedInput, setCompletedInput] = React.useState(input);

  const debouncedSearch = React.useRef(
    debounce((v: string) => {
      setCompletedInput(v);
      searchFunc(v);
    }, opts.delay),
  );

  if (searchFunc && opts.noDelayEmpty && input === '' && completedInput !== '') {
    setCompletedInput('');
  }

  React.useEffect(() => {
    if (searchFunc) {
      if (opts.noDelayEmpty && input === '') {
        debouncedSearch.current.cancel();
        searchFunc(input);
      } else {
        debouncedSearch.current(input);
      }

      return () => {
        debouncedSearch.current.cancel();
      };
    }
  }, [input, searchFunc, opts.noDelayEmpty]);

  const isDebouncing = Boolean(searchFunc) && input !== completedInput;

  return { isDebouncing };
}

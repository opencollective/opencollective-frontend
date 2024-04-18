import React from 'react';
import { debounce } from 'lodash';

export default function useDebouncedSearch(
  searchFunc: ((v: string) => void) | undefined,
  input: string,
  opts: {
    delay?: number;
    noDelayEmpty?: boolean;
  },
): { isDebouncing: boolean } {
  const [isDebouncing, setIsDebouncing] = React.useState(false);

  const debouncedSearch = React.useRef(
    debounce((v: string) => {
      setIsDebouncing(false);
      searchFunc(v);
    }, opts.delay),
  );

  React.useEffect(() => {
    if (searchFunc) {
      if (opts.noDelayEmpty && input === '') {
        debouncedSearch.current.cancel();
        searchFunc(input);
        setIsDebouncing(false);
      } else {
        setIsDebouncing(true);
        debouncedSearch.current(input);
      }

      return () => {
        debouncedSearch.current.cancel();
      };
    }
  }, [input, searchFunc, opts.noDelayEmpty]);

  return { isDebouncing };
}

import React from 'react';
import clsx from 'clsx';
import { debounce } from 'lodash';
import { Search, XIcon } from 'lucide-react';
import { defineMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';

import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

const searchFilterSchema = z.string().min(1).optional().catch(undefined);

export const searchFilter: FilterConfig<z.infer<typeof searchFilterSchema>> = {
  schema: searchFilterSchema,
  filter: {
    labelMsg: defineMessage({ id: 'Search', defaultMessage: 'Search' }),
    StandaloneComponent: SearchFilter,
    static: true,
  },
};

function SearchFilter({ value, labelMsg, onChange, isViewActive }: FilterComponentProps<string>) {
  const intl = useIntl();
  const [input, setInput] = React.useState(value);
  const debouncedOnChange = React.useMemo(() => debounce(onChange, 500), [onChange]);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    // Only update text filter input from outside when it is not focused
    if (inputRef.current !== document.activeElement) {
      setInput(value || '');
    }
  }, [value]);

  return (
    <div className="relative">
      <Search
        size={16}
        className={clsx(
          'pointer-events-none absolute top-0 bottom-0 left-3 h-full text-muted-foreground',
          !isViewActive && value && 'text-primary',
        )}
      />
      <Input
        className={clsx('h-9 w-[150px] rounded-full pr-9 pl-8 lg:w-[200px]')}
        ref={inputRef}
        placeholder={intl.formatMessage(labelMsg)}
        value={input || ''}
        onChange={e => {
          setInput(e.target.value);
          debouncedOnChange(e.target.value);
        }}
      />
      {Boolean(input) && (
        <Button
          variant="link"
          size="xs"
          className="absolute top-1/2 right-3 h-6 w-6 -translate-y-1/2 transform p-1 text-muted-foreground hover:text-foreground"
          title={intl.formatMessage({ id: 'search.clear', defaultMessage: 'Clear search' })}
          onClick={() => {
            setInput('');
            onChange('');
          }}
        >
          <XIcon size={16} />
        </Button>
      )}
    </div>
  );
}

import React from 'react';
import clsx from 'clsx';
import { debounce } from 'lodash';
import { Search } from 'lucide-react';
import { defineMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';

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
          'pointer-events-none absolute bottom-0 left-3 top-0 h-full text-muted-foreground',
          !isViewActive && value && 'text-primary',
        )}
      />
      <Input
        className={clsx('h-9 w-[150px] rounded-full pl-8 lg:w-[200px]')}
        ref={inputRef}
        placeholder={intl.formatMessage(labelMsg)}
        value={input || ''}
        onChange={e => {
          setInput(e.target.value);
          debouncedOnChange(e.target.value);
        }}
      />
    </div>
  );
}

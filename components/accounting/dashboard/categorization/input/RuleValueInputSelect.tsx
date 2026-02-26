import React from 'react';
import { isNil } from 'lodash';
import { CheckIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/Button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';

type RuleValueInputSelectProps = {
  className?: string;
  value: string | number | string[] | number[];
  isMulti?: boolean;
  options?: { label: React.ReactNode; value: string | number | string[] | number[]; keywords?: string[] }[];
  onChange: (value: string | number | string[] | number[]) => void;
  shouldFilter?: boolean;
  error?: boolean;
};

export function RuleValueInputSelect(props: RuleValueInputSelectProps) {
  const { className, value, isMulti = false, options = [], onChange, shouldFilter = true } = props;
  const [input, setInput] = React.useState('');

  const selected = Array.isArray(value) ? value : isNil(value) ? [] : [value];

  const onSelect = value => {
    const isSelected = selected.some(v => v === value);
    if (isMulti) {
      onChange(isSelected ? selected.filter(v => v !== value) : [...selected, value]);
    } else {
      onChange(isSelected ? undefined : value);
    }
  };

  React.useEffect(() => {
    if (!isMulti && Array.isArray(value)) {
      onChange(value[0]);
    }
  }, [isMulti, value, onChange]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('justify-start', className)}>
          {selected.map(v => options.find(o => o.value === v)?.label ?? String(v)).join(', ')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
        <Command shouldFilter={shouldFilter}>
          {shouldFilter && (
            <CommandInput autoFocus value={input} onValueChange={setInput} data-cy="combo-select-input" />
          )}

          <CommandList>
            <CommandEmpty>
              <FormattedMessage defaultMessage="No selection" id="Select.Placeholder" />
            </CommandEmpty>
            {options.map(option => {
              const isSelected = selected.some(v => v === option.value);
              const label = option.label as string;
              const value = option.value as string;
              return (
                <CommandItem
                  onSelect={() => onSelect(value)}
                  className="h-8 py-0"
                  value={value}
                  data-cy={'combo-select-option'}
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center rounded-sm border border-primary',
                      isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                    )}
                  >
                    <CheckIcon className={'h-4 w-4'} />
                  </div>

                  <div className="truncate" title={typeof label === 'string' ? label : undefined}>
                    {label ?? String(value)}
                  </div>
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

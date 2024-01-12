import React from 'react';
import { ClassValue } from 'clsx';

import { cn } from '../../lib/utils';

import { Button } from './Button';

/**
 * A component that lets users pick between multiple options by clicking on buttons.
 */
export function ButtonSet<OptionValue>({
  options,
  selected,
  onChange,
  error,
  className,
  getKey = (value: OptionValue) => value.toString(),
}: {
  options: Array<{ value: OptionValue; label: React.ReactElement | React.ReactNode }>;
  selected: OptionValue;
  onChange: (value: OptionValue) => void;
  error?: boolean;
  className?: ClassValue;
  getKey?: (value: OptionValue) => string;
}) {
  return (
    <div className={cn('mt-2 flex flex-wrap items-center gap-2', className)}>
      {options.map(option => (
        <Button
          key={getKey(option.value)}
          type="button"
          variant={selected === option.value ? 'default' : 'outline'}
          onClick={() => selected !== option.value && onChange(option.value)}
          className={cn({ 'border-red-500': error })}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

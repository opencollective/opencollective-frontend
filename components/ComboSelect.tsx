'use client';

import * as React from 'react';
import { isString } from 'lodash';
import { Check, ChevronDown } from 'lucide-react';
import { defineMessages, useIntl } from 'react-intl';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';

const Messages = defineMessages({
  loading: {
    id: 'Select.Loading',
    defaultMessage: 'Loading...',
  },
  noOptions: {
    id: 'Select.NoOptions',
    defaultMessage: 'Nothing found',
  },
  placeholder: {
    id: 'Select.Placeholder',
    defaultMessage: 'No selection',
  },
  inputPlaceholder: {
    id: 'search.placeholder',
    defaultMessage: 'Search...',
  },
});

type ComboSelectProps = {
  options: Array<{ value: string; label: string | React.JSX.Element; keywords?: string[] }>;
  value: string | undefined;
  onChange: (val: string) => void;
  id?: string;
  disabled?: boolean;
  error?: boolean;
  loading?: boolean;
  className?: string;
  placeholder?: string;
  inputPlaceholder?: string;
  isSearchable?: boolean;
  'data-cy'?: string;
};

// eslint-disable-next-line prefer-arrow-callback
export const ComboSelect = React.memo(function ComboSelect(props: ComboSelectProps) {
  const [open, setOpen] = React.useState(false);
  const intl = useIntl();
  const isSearchable = props.isSearchable ?? props.options?.length > 8;
  const placeholder = props.loading
    ? intl.formatMessage(Messages.loading)
    : (props.placeholder ?? intl.formatMessage(Messages.placeholder));
  const selectedOption = props.options.find(option => option.value === props.value);

  const { onChange } = props;
  const onChangeCallback = React.useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
    },
    [onChange],
  );

  if (!isSearchable) {
    return (
      <Select
        open={open}
        onOpenChange={setOpen}
        onValueChange={onChangeCallback}
        value={props.value}
        disabled={props.disabled}
      >
        <SelectTrigger
          className={cn({ 'text-muted-foreground': !props.value }, props.className)}
          id={props.id}
          data-cy={props['data-cy']}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent data-cy="select-content">
          {props.options.map(option => (
            <SelectItem key={option.value} value={option.value} data-cy="select-option">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={props.id}
          disabled={props.disabled}
          data-cy={props['data-cy']}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between font-normal', { 'text-muted-foreground': !props.value }, props.className)}
        >
          {selectedOption?.label ?? placeholder ?? intl.formatMessage(Messages.placeholder)}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-sm p-0" data-cy="select-content">
        <Command>
          <CommandInput placeholder={props.inputPlaceholder || intl.formatMessage(Messages.inputPlaceholder)} />
          <CommandList>
            <CommandEmpty>{intl.formatMessage(Messages.noOptions)}</CommandEmpty>
            <CommandGroup>
              {props.options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={option.keywords || (isString(option.label) ? [option.label] : undefined)}
                  onSelect={onChangeCallback}
                  data-cy="select-option"
                >
                  <Check className={cn('mr-2 h-4 w-4', props.value === option.value ? 'opacity-100' : 'opacity-0')} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

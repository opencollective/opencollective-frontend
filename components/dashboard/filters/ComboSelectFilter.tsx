import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { debounce, isUndefined } from 'lodash';
import { CheckIcon } from 'lucide-react';
import type { MessageDescriptor } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import type { FilterConfig } from '../../../lib/filters/filter-types';
import { sortSelectOptions } from '../../../lib/utils';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from '../../ui/Command';

const SelectItem = ({
  isSelected,
  value,
  label,
  onSelect,
  valueRenderer,
}: {
  isSelected: boolean;
  value: any;
  label?: React.ReactNode;
  onSelect: (value: any) => void;
  valueRenderer?: ({ value, withHoverCard }: { value: string; withHoverCard?: boolean }) => React.ReactNode;
}) => {
  return (
    <CommandItem onSelect={() => onSelect(value)} className="h-8 py-0" value={value} data-cy={'combo-select-option'}>
      <div
        className={clsx(
          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
          isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
        )}
      >
        <CheckIcon className={'h-4 w-4'} />
      </div>

      {valueRenderer ? valueRenderer({ value, withHoverCard: true }) : label ?? String(value)}
    </CommandItem>
  );
};

const useDebouncedSearch = (searchFunc, input, delay) => {
  // Create a ref to track the first render
  const isFirstRender = useRef(true);

  // Define the debounced function
  const debouncedSearch = useRef(
    debounce((searchFunc, input) => {
      return searchFunc(input);
    }, delay),
  ).current;

  useEffect(() => {
    if (searchFunc) {
      if (isFirstRender.current) {
        // If it's the first render, call the search function immediately
        searchFunc(input);
        isFirstRender.current = false;
      } else {
        // Otherwise, use the debounced function
        debouncedSearch(searchFunc, input);
      }
    }
  }, [input, searchFunc, debouncedSearch]);
};

function ComboSelectFilter({
  value,
  isMulti = false,
  options = [],
  groupedOptions,
  onChange,
  labelMsg,
  loading,
  creatable,
  searchFunc,
  valueRenderer,
}: {
  value: any;
  isMulti?: boolean;
  selected?: string[];
  options?: { label: React.ReactNode; value: any }[];
  groupedOptions?: { label: string; options: { label: React.ReactNode; value: any }[] }[];
  onChange: (value: any) => void;
  labelMsg?: MessageDescriptor;
  loading?: boolean;
  creatable?: boolean;
  searchFunc?: (term?: string) => void;
  valueRenderer?: ({ value }: { value: any }) => React.ReactNode;
}) {
  const intl = useIntl();
  const [input, setInput] = React.useState('');

  const selected = Array.isArray(value) ? value : !isUndefined(value) ? [value] : [];

  useDebouncedSearch(searchFunc, input, 500);

  const onSelect = value => {
    const isSelected = selected.some(v => v === value);
    if (isMulti) {
      onChange(isSelected ? selected.filter(v => v !== value) : [...selected, value]);
    } else {
      onChange(isSelected ? undefined : value);
    }
  };
  return (
    <Command shouldFilter={!searchFunc}>
      <CommandInput
        autoFocus
        loading={loading}
        value={input}
        onValueChange={setInput}
        data-cy="combo-select-input"
        placeholder={
          labelMsg
            ? intl.formatMessage(
                {
                  defaultMessage: 'Filter by {filterLabel}...',
                },
                { filterLabel: intl.formatMessage(labelMsg) },
              )
            : intl.formatMessage({ id: 'search.placeholder', defaultMessage: 'Search...' })
        }
      />

      <CommandList>
        {loading && !options?.length ? (
          <CommandLoading />
        ) : (
          <CommandEmpty>
            <FormattedMessage defaultMessage="No results found." />
          </CommandEmpty>
        )}

        {options?.length > 0 && (
          <CommandGroup>
            {creatable && input && (
              <SelectItem
                isSelected={selected.some(v => v === input)}
                value={input}
                label={input}
                onSelect={onSelect}
              />
            )}

            {searchFunc &&
              selected
                .filter(v => !options.some(o => o.value === v))
                .filter(v => !creatable || v !== input)
                .map(v => (
                  <SelectItem key={v} isSelected={true} value={v} onSelect={onSelect} valueRenderer={valueRenderer} />
                ))}

            {options
              .filter(o => !creatable || o.value !== input)
              .map(option => {
                const isSelected = selected.some(v => v === option.value);
                return (
                  <SelectItem
                    key={option.value}
                    isSelected={isSelected}
                    value={option.value}
                    label={option.label}
                    onSelect={onSelect}
                  />
                );
              })}
          </CommandGroup>
        )}

        {groupedOptions
          ?.filter(group => group.options.length)
          .map(group => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.options.map(option => {
                const isSelected = selected.some(v => v === option.value);
                return (
                  <SelectItem
                    key={option.value}
                    isSelected={isSelected}
                    value={option.value}
                    label={option.label}
                    onSelect={onSelect}
                  />
                );
              })}
            </CommandGroup>
          ))}
      </CommandList>
    </Command>
  );
}

export default React.memo(ComboSelectFilter) as typeof ComboSelectFilter;

type ZodDefaultOrOptional<T extends z.ZodTypeAny> = z.ZodDefault<T> | z.ZodOptional<T>;

export function buildComboSelectFilter<
  Options extends [string, ...string[]],
  Schema extends ZodDefaultOrOptional<z.ZodEnum<Options> | z.ZodArray<z.ZodEnum<Options>>>,
>(
  schema: Schema,
  labelMsg: MessageDescriptor,
  i18nLabels: Record<z.infer<z.ZodEnum<Options>>, MessageDescriptor>,
): FilterConfig<z.infer<Schema>> {
  const schemaWithoutDefault = 'removeDefault' in schema ? schema.removeDefault() : schema.unwrap();

  const isMulti = 'element' in schemaWithoutDefault;
  const schemaEnum = isMulti ? schemaWithoutDefault.element : schemaWithoutDefault;

  return {
    schema: isMulti ? schema.or(schemaEnum.transform(val => [val])) : schema,
    filter: {
      labelMsg,
      Component: ({ intl, ...props }) => (
        <ComboSelectFilter
          isMulti={isMulti}
          options={schemaEnum.options
            .map(value => ({
              value,
              label: intl.formatMessage(i18nLabels[value]),
            }))
            .sort(sortSelectOptions)}
          {...props}
        />
      ),
      valueRenderer: ({ value, intl }) => intl.formatMessage(i18nLabels[value]),
    },
  };
}

import * as React from 'react';
import { CheckIcon, PlusCircle } from 'lucide-react';

import { cn } from '../../lib/utils';

import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../ui/CommandMenu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Separator } from '../ui/Separator';
import { FilterOptions } from './FilterCombo';
import { isNil } from 'lodash';

interface DataTableFacetedFilter {
  title?: string;
  value?: string | string[];
  // onChange: (value: string | string[]) => void;
  options?: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  filterKey?: string;
  filterOptions: FilterOptions;
}

export function FilterDropdown({ title, value, onChange, filterKey, filterOptions }: DataTableFacetedFilter) {
  const arrayValue = isNil(value) ? null : Array.isArray(value) ? value : [value];
  const [filterKeyState, setFilterKeyState] = React.useState(filterKey);
  const rootFilterOptions = filterOptions.map(option => ({ label: option.label, value: option.key }));
  const selectedValues = new Set(arrayValue);
  const options = filterKeyState
    ? filterOptions.find(filterOption => filterOption.key === filterKeyState)?.options
    : rootFilterOptions;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-9', value ? '' : ' text-slate-500')}>
          {!value && <PlusCircle className="mr-2 h-4 w-4" />}

          {title}
          {selectedValues.size > 0 && (
            <React.Fragment>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge size="xs" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge size="xs" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter(option => selectedValues.has(option.value))
                    .map(option => (
                      <Badge size="xs" key={option.value} className="rounded-sm px-1 font-normal">
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </React.Fragment>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map(option => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value);
                      } else {
                        selectedValues.add(option.value);
                      }
                      const filterValues = Array.from(selectedValues);
                      const [firstValue] = filterValues;
                      // onChange(filterValues.length ? filterValues : undefined);
                      onChange({ [filterKey]: firstValue });
                    }}
                  >
                    {filterKeyState && (
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                        )}
                      >
                        <CheckIcon className={cn('h-4 w-4')} />
                      </div>
                    )}

                    {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span>{option.label}</span>
                    {/* {facets?.get(option.value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    )} */}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <React.Fragment>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => onChange(undefined)} className="justify-center text-center">
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </React.Fragment>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

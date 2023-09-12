'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Filter, X } from 'lucide-react';

import { cn } from '../../lib/utils';

import Button from '../ui/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/CommandMenu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
function formatString(str) {
  // Convert the string to lowercase, replace underscores with spaces
  const newStr = str.toLowerCase().replace(/_/g, ' ');

  return newStr.charAt(0).toUpperCase() + newStr.slice(1);
}

export function FilterCombo({ filterOptions, currentFilter, filterType, onChange }) {
  const active = false;
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  // const [pages, setPages] = React.useState([]);
  const defaultType = currentFilter
    ? filterOptions.find(filterOption => filterOption.key === currentFilter.key)
    : filterType ?? null;
  const [type, setType] = React.useState(defaultType);

  const resetType = () => {
    setType(defaultType);
    setSearch('');
  };

  const typeOptions = type?.options || [];
  const inputRef = React.useRef(null);
  return (
    <Popover
      open={open}
      onOpenChange={open => {
        setOpen(open);
        resetType();
      }}
    >
      {currentFilter ? (
        <div
          className={cn(
            'animate-in fade-in  flex items-stretch overflow-hidden whitespace-nowrap rounded-md text-sm font-medium  shadow-sm  transition-all duration-500 hover:shadow',
            active ? 'bg-white text-blue-900 ring-1 ring-blue-400' : 'bg-white text-gray-900  ring-1 ring-gray-300',
          )}
        >
          <PopoverTrigger asChild>
            <button className={cn(' py-1.5 pl-2.5 pr-1', active ? 'hover:bg-blue-100' : 'hover:bg-gray-50')}>
              <span className="font-normal text-gray-500">
                {currentFilter.label} {currentFilter.key === 'searchTerm' && <React.Fragment>&quot;</React.Fragment>}
                <span className="font-medium text-gray-900">
                  {currentFilter.key === 'searchTerm' ? currentFilter.value : formatString(currentFilter.value)}
                </span>
                {currentFilter.key === 'searchTerm' && <React.Fragment>&quot;</React.Fragment>}
              </span>
            </button>
          </PopoverTrigger>

          <button
            onClick={() => onChange({ [currentFilter.key]: type.noFilter ?? null })}
            className={cn(
              'flex min-h-full  shrink-0 items-center pl-1 pr-1.5 hover:bg-gray-50',
              active
                ? 'text-blue-500 hover:bg-blue-100 hover:text-blue-900'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <X size={14} />
          </button>
          {/* <ChevronDown size={14} /> */}
        </div>
      ) : (
        <PopoverTrigger asChild>
          <button className="animate-in duration-400 fade-in flex flex-nowrap items-center gap-1 rounded-md bg-white  px-2.5 py-1.5 text-sm font-medium text-gray-500 ring-1 ring-gray-300 transition-all  hover:bg-gray-50 hover:text-gray-900 hover:shadow ">
            {type ? (
              <span className="font-normal">
                {type.label} {type.key !== 'searchTerm' && 'is'}
              </span>
            ) : (
              <React.Fragment>
                <Filter size={16} className="text-gray-400" />
                <span>Add Filter</span>
              </React.Fragment>
            )}
          </button>
        </PopoverTrigger>
      )}

      <PopoverContent align="start" className="w-[200px] bg-white p-0">
        <Command
          onKeyDown={e => {
            if (!currentFilter && (e.key === 'Escape' || (e.key === 'Backspace' && !search))) {
              e.preventDefault();
              setType(null);
            }
          }}
        >
          <CommandInput
            className="focus:outline-none"
            placeholder={!type ? 'Search...' : type.key === 'searchTerm' ? 'Search term' : `Filter on ${type.label}...`}
            value={search}
            onValueChange={setSearch}
            ref={inputRef}
          />
          {/* <CommandEmpty>No framework found.</CommandEmpty> */}
          <CommandList className="p-1">
            {!type && (
              <React.Fragment>
                {filterOptions?.map(type => (
                  <CommandItem
                    onSelect={() => {
                      setType(type);
                      setSearch('');
                      inputRef.current?.focus();
                    }}
                  >
                    {type.label}
                  </CommandItem>
                ))}

                {/* <CommandItem onSelect={() => setPages([...pages, 'projects'])}>Search projects…</CommandItem>
                <CommandItem onSelect={() => setPages([...pages, 'teams'])}>Join a team…</CommandItem> */}
              </React.Fragment>
            )}
            {typeOptions.map(option => {
              const selected = currentFilter?.value === option;
              return (
                <CommandItem
                  key={option}
                  onSelect={() => {
                    setSearch('');
                    setOpen(false);
                    onChange({ [type.key]: option });
                    setType(null);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                  {formatString(option)}
                </CommandItem>
              );
            })}
            {search.length > 0 && (
              <CommandItem
                key={'search'}
                onSelect={() => {
                  setSearch('');
                  setOpen(false);
                  onChange({ searchTerm: search });
                  setType(null);
                }}
              >
                Search for &quot;<span className="font-bold">{search}</span>&quot;
              </CommandItem>
            )}
          </CommandList>
          {/* <CommandGroup>
            {frameworks.map(framework => (
              <CommandItem
                key={framework.value}
                onSelect={currentValue => {
                  setSearch(currentValue === search ? '' : currentValue);
                  setOpen(false);
                }}
              >
                <Check className={cn('mr-2 h-4 w-4', search === framework.value ? 'opacity-100' : 'opacity-0')} />
                {framework.label}
              </CommandItem>
            ))}
          </CommandGroup> */}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Filter, X } from 'lucide-react';

import { cx as cn } from 'class-variance-authority';
import Button from './button';
import { Command, CommandEmpty, CommandList, CommandGroup, CommandInput, CommandItem } from './cmdk';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
function formatString(str) {
  // Convert the string to lowercase, replace underscores with spaces
  const newStr = str.toLowerCase().replace(/_/g, ' ');

  return newStr.charAt(0).toUpperCase() + newStr.slice(1);
}

export function FilterCombo({ filterOptions, filter, onChange }) {
  const active = false;
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  // const [pages, setPages] = React.useState([]);
  const defaultType = filter ? filterOptions.find(filterOption => filterOption.key === filter.key) : null;
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
      {filter ? (
        <div
          className={cn(
            'animate-in whitespace-nowrap  duration-500 fade-in text-sm rounded-md overflow-hidden flex items-stretch  font-medium  hover:shadow transition-all shadow-sm',
            active ? 'ring-blue-400 bg-white ring-1 text-blue-900' : 'ring-gray-300 bg-white  ring-1 text-gray-900',
          )}
        >
          <PopoverTrigger asChild>
            <button className={cn(' pl-2.5 py-1.5 pr-1', active ? 'hover:bg-blue-100' : 'hover:bg-gray-50')}>
              <span className="text-gray-500 font-normal">
                {filter.label} {filter.key === 'searchTerm' && <>&quot;</>}
                <span className="text-gray-900 font-medium">
                  {filter.key === 'searchTerm' ? filter.value : formatString(filter.value)}
                </span>
                {filter.key === 'searchTerm' && <>&quot;</>}
              </span>
            </button>
          </PopoverTrigger>

          <button
            onClick={() => onChange({ [filter.key]: type.noFilter ?? null })}
            className={cn(
              'hover:bg-gray-50 shrink-0  pr-1.5 pl-1 min-h-full flex items-center',
              active
                ? 'hover:bg-blue-100 text-blue-500 hover:text-blue-900'
                : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900',
            )}
          >
            <X size={14} />
          </button>
          {/* <ChevronDown size={14} /> */}
        </div>
      ) : (
        <PopoverTrigger asChild>
          <button className="animate-in bg-white hover:bg-gray-50 duration-400 fade-in text-sm px-2.5 py-1.5 rounded-md  flex items-center flex-nowrap gap-1 text-gray-500 hover:text-gray-900 font-medium ring-1  ring-gray-300 hover:shadow transition-all ">
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

      <PopoverContent align="start" className="w-[200px] p-0 bg-white">
        <Command
          onKeyDown={e => {
            if (!filter && (e.key === 'Escape' || (e.key === 'Backspace' && !search))) {
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
              <>
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
              </>
            )}
            {typeOptions.map(option => {
              const selected = filter?.value === option;
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

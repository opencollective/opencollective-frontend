import React from 'react';
import { Input } from '../ui/Input';
import { FilterDropdown } from './FilterDropdown';

export enum FilterType {
  TEXT_INPUT = 'TEXT_INPUT',
  SELECT = 'SELECT',
  DATE = 'DATE',
  MULTI_SELECT = 'MULTI_SELECT',
}
type Filter = {
  key: string;
  label: string;
  static?: boolean;
  filterType: FilterType;
  options?: {
    label: string;
    value: string | boolean;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  value?: string | string[];
};

export type FilterOptions = Filter[];

// look up how to do conditional types in typescript

export default function FilterComboNew({ filter, filterOptions }: { filter?: Filter; filterOptions?: FilterOptions }) {
  if (filter) {
    if (filter.static && filter.filterType === FilterType.TEXT_INPUT) {
      return <Input className="h-8 w-[150px] lg:w-[250px]" placeholder={filter.label} value={filter.value} />;
    }
    return (
      <FilterDropdown
        title={filter.label}
        // options={filter.options}
        value={filter.value}
        onChange={e => console.log(e)}
        filterOptions={filterOptions}
        filterKey={filter.key}
      />
    );
  }
  return <FilterDropdown title={'Add Filter'} filterOptions={filterOptions} onChange={e => console.log(e)} />;
}

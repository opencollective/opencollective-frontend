import React from 'react';
export enum FilterType {
  TEXT_INPUT = 'TEXT_INPUT',
  SELECT = 'SELECT',
  PERIOD = 'PERIOD',
  MULTI_SELECT = 'MULTI_SELECT',
}

export enum OptionType {
  PERIOD = 'PERIOD',
  CUSTOM_DATE_RANGE = 'CUSTOM_DATE_RANGE',
}
export type Filter = {
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

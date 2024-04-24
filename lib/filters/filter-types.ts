import type React from 'react';
import type { IntlShape, MessageDescriptor } from 'react-intl';
import type { z } from 'zod';

export type FilterConfig<FilterValue> = {
  schema: z.ZodType<FilterValue, any, any>;
  filter?: FilterComponentConfig<FilterValue>;
  toVariables?: FilterToVariables<FilterValue>;
};

type FilterToVariables<FV, K = string, M = any, QV = any> = (value: FV, key: K, meta: M) => Partial<QV>;

export type FiltersToVariables<FilterValues, QueryVariables, FilterMeta = any> = {
  [K in keyof FilterValues]: FilterToVariables<FilterValues[K], K, FilterMeta, QueryVariables>;
};

export type FilterComponentProps<FilterValue, Meta = Record<string, any>> = {
  value: FilterValue;
  onChange: (val: FilterValue) => void;
  intl: IntlShape;
  meta?: Meta;
  labelMsg?: MessageDescriptor;
  isViewActive?: boolean;
  valueRenderer?: ValueRenderer<FilterValue, Meta>;
};

type ValueRenderer<FilterValue, Meta> = (props: {
  value: IfArrayThenElement<FilterValue>;
  meta?: Meta;
  intl?: IntlShape;
}) => React.ReactNode;

type IfArrayThenElement<T> = T extends Array<infer U> ? U : T;

type DropdownFilter<FilterValue, Meta> = {
  Component?: (props: FilterComponentProps<FilterValue, Meta>) => React.ReactNode;
  StandaloneComponent?: never;
  valueRenderer?: ValueRenderer<FilterValue, Meta>;
};

export type SetFilter<FV> = <K extends keyof FV>(filter: K, value: FV[K], resetPagination?: boolean) => void;
export type SetFilters<FV> = (filters: Partial<FV>, newPath?: string) => void;
export type resetFilters<FV> = (filters: Partial<FV>, newPath?: string) => void;

export type StandaloneFilter<FilterValue, Meta = any> = {
  static: true;
  Component?: never;
  StandaloneComponent: (props: FilterComponentProps<FilterValue, Meta>) => React.ReactNode;
};

export type FilterComponentConfig<FilterValue, Meta = any> = {
  labelMsg?: MessageDescriptor;
  static?: boolean;
  hide?: ({ meta }: { meta: Meta }) => boolean;
} & (DropdownFilter<FilterValue, Meta> | StandaloneFilter<FilterValue, Meta>);

export type FilterComponentConfigs<FilterValues = Record<string, any>, Meta = any> = Partial<{
  [K in keyof FilterValues]: FilterComponentConfig<FilterValues[K], Meta>;
}>;

export type Views<FV> = {
  label: string;
  filter: Partial<FV>;
  id: string;
  count?: number;
}[];

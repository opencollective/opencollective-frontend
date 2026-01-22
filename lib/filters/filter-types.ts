import type React from 'react';
import type { IntlShape, MessageDescriptor } from 'react-intl';
import type { z } from 'zod';

export type FilterConfig<FilterValue, FilterMeta = unknown, FilterKey = string, ToVariablesReturnType = unknown> = {
  schema: z.ZodType<FilterValue, z.ZodTypeDef, unknown>;
  filter?: FilterComponentConfig<FilterValue, FilterMeta>;
  toVariables?: FilterToVariables<FilterValue, FilterKey, FilterMeta, ToVariablesReturnType>;
};

type FilterToVariables<FilterValue, K = string, M = unknown, QV = unknown, FilterValues = Record<string, unknown>> = (
  value: FilterValue,
  key: K,
  meta: M,
  values?: FilterValues,
) => Partial<QV>;

export type FiltersToVariables<FilterValues, QueryVariables, FilterMeta = unknown> = {
  [K in keyof FilterValues]: FilterToVariables<FilterValues[K], K, FilterMeta, QueryVariables, FilterValues>;
};

export type FilterComponentProps<
  FilterValue,
  Meta = Record<string, unknown>,
  FilterValues = Record<string, unknown>,
> = {
  value: FilterValue;
  onChange: (val: FilterValue) => void;
  intl: IntlShape;
  meta?: Meta;
  labelMsg?: MessageDescriptor;
  highlighted?: boolean;
  locked?: boolean;
  valueRenderer?: ValueRenderer<FilterValue, Meta>;
  values?: FilterValues;
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

type StandaloneFilter<FilterValue, Meta = unknown> = {
  static: true;
  Component?: never;
  StandaloneComponent: (props: FilterComponentProps<FilterValue, Meta>) => React.ReactNode;
};

type FilterComponentConfig<FilterValue, Meta = unknown> = {
  labelMsg?: MessageDescriptor;
  static?: boolean;
  hide?: ({ meta }: { meta: Meta }) => boolean;
  getDisallowEmpty?: ({ meta }: { meta: Meta }) => boolean;
} & (DropdownFilter<FilterValue, Meta> | StandaloneFilter<FilterValue, Meta>);

export type FilterComponentConfigs<FilterValues = Record<string, unknown>, Meta = unknown> = Partial<{
  [K in keyof FilterValues]: FilterComponentConfig<FilterValues[K], Meta>;
}>;

export type View<FV> = {
  label: string;
  filter: Partial<FV>;
  id: string;
  count?: number;
};

export type Views<FV> = readonly View<FV>[];

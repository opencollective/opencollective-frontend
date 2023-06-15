import React from 'react';
import { compact, omit, uniq } from 'lodash';
import { useRouter } from 'next/router';

interface CommonFilterDefinition {
  isMulti?: boolean;
  queryParam?: string;
}

interface FilterDefinitionWithoutSerialization extends CommonFilterDefinition {
  deserialize?: never;
  serialize?: never;
}

interface FilterDefinitionWithSerialization extends CommonFilterDefinition {
  deserialize: (q: string) => any;
  serialize: (v: any) => string;
}

type FilterDefinition = FilterDefinitionWithoutSerialization | FilterDefinitionWithSerialization;

type Filters = {
  [K: string]: FilterDefinition;
};

type UseQueryFilterOptions<F extends Filters> = {
  filters: F;
  ignoreQueryParams?: string[];
};

type FilterValueType<F extends FilterDefinition> = F extends FilterDefinitionWithSerialization
  ? ReturnType<F['deserialize']>
  : string;
type FilterValuesType<F extends FilterDefinition> = F extends { isMulti: true }
  ? Array<FilterValueType<F>>
  : FilterValueType<F>;

type UseQueryFilterHook<F extends Filters> = {
  setFilter<K extends keyof F>(filter: K, value: FilterValuesType<F[K]>): void;
  values: {
    [K in keyof F]: FilterValuesType<F[K]>;
  };
} & {
  [K in string & keyof F as `set${Capitalize<K>}`]: (value: FilterValuesType<F[K]>) => void;
};

export default function useQueryFilter<F extends Filters>(opts: UseQueryFilterOptions<F>): UseQueryFilterHook<F> {
  const router = useRouter();

  const filterValues = React.useMemo(() => {
    return Object.keys(opts.filters).reduce((acc, filterName) => {
      const filterDefinition = opts.filters[filterName];
      const filterQueryParam = filterDefinition.queryParam ?? filterName;
      const deserializeFn = filterDefinition?.deserialize ?? (v => v);

      let filterQueryValues = router.query[filterQueryParam];
      if (typeof filterQueryValues === 'string') {
        filterQueryValues = [filterQueryValues];
      }

      filterQueryValues = compact(uniq(filterQueryValues));

      const deserializedValue = filterDefinition.isMulti
        ? filterQueryValues.map(s => deserializeFn(s))
        : filterQueryValues.length > 0
        ? deserializeFn(filterQueryValues?.[0])
        : null;

      return {
        ...acc,
        [filterName]: deserializedValue,
      };
    }, {}) as { [K in keyof F]: FilterValuesType<F[K]> };
  }, [opts.filters, router.query]);

  const setFilter = React.useCallback(
    (filterName: keyof F, filterValue: any) => {
      const filterDefinition = opts.filters[filterName];
      const filterQueryParam = filterDefinition.queryParam ?? filterName;
      const serializeFn = filterDefinition?.serialize ?? (v => v);

      const serializedValue = filterDefinition.isMulti
        ? (filterValue as Array<any>).map(v => serializeFn(v))
        : serializeFn(filterValue);

      let newFilterQueryValues = omit(router.query, opts.ignoreQueryParams);

      if (!serializedValue || serializedValue.length === 0) {
        newFilterQueryValues = omit(newFilterQueryValues, filterQueryParam);
      } else {
        newFilterQueryValues = { ...newFilterQueryValues, [filterQueryParam]: serializedValue };
      }

      const basePath = router.asPath.split('?')[0];
      router.push(
        {
          pathname: basePath,
          query: newFilterQueryValues,
        },
        null,
        { scroll: false },
      );
    },
    [opts.ignoreQueryParams, opts.filters, router, router.query],
  );

  const setFns = React.useMemo(() => {
    return Object.keys(opts.filters).reduce((acc, filterName) => {
      return {
        ...acc,
        [`set${capitalize(filterName)}`]: (value: string[]) => setFilter(filterName, value),
      };
    }, {}) as { [K in string & keyof F as `set${Capitalize<K>}`]: (value: FilterValuesType<F[K]>) => void };
  }, [opts.filters, setFilter]);

  return {
    ...setFns,
    setFilter,
    values: filterValues,
  };
}

function capitalize(v: string) {
  const first = v[0];
  return `${first.toUpperCase()}${v.slice(1)}`;
}

import React from 'react';
import { forEach, isEmpty, isNil, isUndefined, omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { z } from 'zod';

import { toast } from '../../components/ui/useToast';

import type {
  FilterComponentConfigs,
  FiltersToVariables,
  resetFilters,
  SetFilter,
  SetFilters,
  Views,
} from '../filters/filter-types';
import {
  destructureFilterValues,
  getActiveViewId,
  getFilterValueFromQueryValue,
  getQueryValueFromFilterValue,
  structureQueryValues,
} from '../filters/filter-utils';

export type useQueryFilterReturnType<S extends z.ZodObject<z.ZodRawShape, any, any>, GQLQueryVars> = {
  values: z.infer<S>;
  variables: Partial<GQLQueryVars>;
  resetFilters: resetFilters<z.infer<S>>;
  setFilter: SetFilter<z.infer<S>>;
  setFilters: SetFilters<z.infer<S>>;
  hasFilters: boolean;
  activeViewId?: string;
  filters: FilterComponentConfigs<z.infer<S>>;
  views?: Views<z.infer<S>>;
  meta?: any;
  defaultSchemaValues: Partial<z.infer<S>>;
};

type useQueryFilterOptions<S extends z.ZodObject<z.ZodRawShape, any, any>, GQLQueryVars, FilterMeta = any> = {
  schema: S; // Schema for all query filters (both those which are available to the user in Query and those which are not)
  filters: FilterComponentConfigs<z.infer<S>, FilterMeta>; // Configuration of filters available to the user in the `Filter` component (used in this hook to determine `hasFilters` and `activeViewId`)
  toVariables?: Partial<FiltersToVariables<z.infer<S>, GQLQueryVars, FilterMeta>>;
  defaultFilterValues?: Partial<z.infer<S>>; // Default valuFes for filters, views[0].filter will be used if not set
  meta?: FilterMeta;
  views?: Views<z.infer<S>>;
  skipRouter?: boolean; // Used when not updating the URL query is desired, this will instead use internal state.
};

export default function useQueryFilter<S extends z.ZodObject<z.ZodRawShape, any, any>, GQLQueryVars, FilterMeta = any>(
  opts: useQueryFilterOptions<S, GQLQueryVars, FilterMeta>,
): useQueryFilterReturnType<S, GQLQueryVars> {
  const intl = useIntl();
  const router = useRouter();
  const [stateQuery, setStateQuery] = React.useState({}); // Only used together with skipRouter

  const query = opts.skipRouter ? stateQuery : router.query;

  // Default values set by the page, views, or the user (eventually)
  const defaultFilterValues = React.useMemo(
    () => opts.defaultFilterValues || opts.views?.[0]?.filter || {},
    [opts.defaultFilterValues, opts.views],
  );
  // Default values defined by the schema
  const defaultSchemaValues = opts.schema.parse({});

  const values = React.useMemo(() => {
    const structuredQuery = structureQueryValues(query);

    // Add defaultFilterValues (which are not part of the URL query)
    // and remove default value fallback "ALL" before parsing the query
    const queryWithDefaultFilterValues = Object.keys(defaultFilterValues).reduce(
      (acc, filterName) => ({
        ...acc,
        [filterName]: getFilterValueFromQueryValue(structuredQuery[filterName], defaultFilterValues[filterName]),
      }),
      structuredQuery,
    );

    // This will validate the query values against the schema (and add the default schema values if those fields are not set))
    const result = opts.schema.safeParse(queryWithDefaultFilterValues);

    if (result.success) {
      return result.data;
    } else if (result.success === false) {
      addFilterValidationErrorToast(result.error, intl);
    }
    return opts.schema.parse(defaultFilterValues);
  }, [intl, opts.schema, query, defaultFilterValues]);

  const variables = React.useMemo(() => {
    let apiVariables: Partial<GQLQueryVars> = {};

    // Iterate over each entry in the values object
    for (const [key, value] of Object.entries(omitBy(values, isUndefined))) {
      // If a specific toVariables function exists for this key, use it
      if (opts.toVariables?.[key]) {
        apiVariables = {
          ...apiVariables,
          ...opts.toVariables[key](value, key, opts.meta),
        };
      } else {
        apiVariables = {
          ...apiVariables,
          [key]: value,
        };
      }
    }

    return apiVariables;
  }, [values, opts.toVariables, opts.meta]);

  const resetFilters = React.useCallback(
    (newFilters, newPath?: string) => {
      const result = opts.schema.safeParse(newFilters);

      if (result.success) {
        const filterValues = result.data;
        // Get replacements for default values that should not be part of the URL query
        const queryWithReplacementsForDefaults = Object.keys({ ...defaultFilterValues, ...defaultSchemaValues }).reduce(
          (acc, filterName) => ({
            ...acc,
            [filterName]: getQueryValueFromFilterValue(
              filterValues[filterName],
              defaultFilterValues[filterName],
              defaultSchemaValues?.[filterName],
            ),
          }),
          filterValues,
        );
        const desctructuredQueryValues = destructureFilterValues(queryWithReplacementsForDefaults);

        if (opts.skipRouter && !newPath) {
          setStateQuery(desctructuredQueryValues);
        } else {
          const query = omitBy(desctructuredQueryValues, isNil);
          const basePath = newPath || router.asPath.split('?')[0];

          router.push(
            {
              pathname: basePath,
              query,
            },
            null,
            { scroll: false },
          );
        }
      }

      if (result.success === false) {
        addFilterValidationErrorToast(result.error, intl);
      }
    },
    [defaultFilterValues, opts.schema, router.asPath],
  );

  const setFilter = React.useCallback(
    (filterName, filterValue, resetPagination = true) =>
      resetFilters({ ...(resetPagination ? omit(values, 'offset') : values), [filterName]: filterValue }),
    [values, resetFilters],
  );

  const setFilters = React.useCallback(
    (newFilters, newPath) => resetFilters({ ...omit(values, 'offset'), ...newFilters }, newPath),
    [values, resetFilters],
  );

  const hasFilters = React.useMemo(
    () => !isEmpty(omitBy(opts.filters, (v, key) => values[key] === defaultSchemaValues[key] || key === 'orderBy')),
    [values, opts.filters, defaultSchemaValues],
  );

  const activeViewId = React.useMemo(
    () => getActiveViewId(values, { filters: opts.filters, views: opts.views, defaultSchemaValues }),
    [values, opts.filters, opts.views],
  );

  return {
    values,
    variables,
    resetFilters,
    setFilter,
    setFilters,
    hasFilters,
    activeViewId,
    defaultSchemaValues,
    filters: opts.filters,
    views: opts.views,
    meta: opts.meta,
  };
}

function addFilterValidationErrorToast(error, intl) {
  let errorMessage = '';

  forEach(error.errors, error => {
    errorMessage = `${errorMessage} ${error.path.join(', ')}: ${error.message} \n`;
  });

  setImmediate(() => {
    toast({
      variant: 'error',
      title: intl.formatMessage({ defaultMessage: 'Filter validation error', id: 'thZrl7' }),
      message: errorMessage,
    });
  });
}

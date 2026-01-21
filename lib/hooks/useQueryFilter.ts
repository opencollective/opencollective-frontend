import React from 'react';
import { forEach, isEmpty, isNil, isUndefined, omit, omitBy, pick } from 'lodash';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import type { z } from 'zod';

import type { NextParsedUrlQuery } from 'next/dist/server/request-meta';

import { toast } from '../../components/ui/useToast';

import type {
  FilterComponentConfigs,
  FiltersToVariables,
  resetFilters,
  SetFilter,
  SetFilters,
  View,
} from '../filters/filter-types';
import {
  destructureFilterValues,
  getActiveViewId,
  getFilterValueFromQueryValue,
  getQueryValueFromFilterValue,
  structureQueryValues,
} from '../filters/filter-utils';
import { omitDeepBy } from '../utils';

/**
 * Helper function to extract filter variables from the query using server-side rendering context.
 */
export function getSSRVariablesFromQuery<S extends z.ZodObject<z.ZodRawShape>, GQLQueryVars, FilterMeta = unknown>({
  query,
  schema,
  toVariables,
  meta,
  defaultFilterValues = {},
}: {
  query: NextParsedUrlQuery;
  schema: S;
  meta?: FilterMeta;
  toVariables: Partial<FiltersToVariables<z.infer<S>, GQLQueryVars, FilterMeta>>;
  defaultFilterValues?: Partial<z.infer<S>>;
}): Partial<z.infer<S>> {
  const structuredQuery = structureQueryValues(query);
  const queryWithDefaultFilterValues = Object.keys(defaultFilterValues).reduce(
    (acc, filterName) => ({
      ...acc,
      [filterName]: getFilterValueFromQueryValue(structuredQuery[filterName], defaultFilterValues[filterName]),
    }),
    structuredQuery,
  );

  // This will validate the query values against the schema (and add the default schema values if those fields are not set))
  const values = schema.safeParse(queryWithDefaultFilterValues)?.data;
  let apiVariables: Partial<GQLQueryVars> = {};

  // Iterate over each entry in the values object
  for (const [key, value] of Object.entries(omitBy(values, isUndefined))) {
    // If a specific toVariables function exists for this key, use it
    if (toVariables?.[key]) {
      apiVariables = {
        ...apiVariables,
        ...toVariables[key](value, key, meta, values),
      };
    } else {
      apiVariables = {
        ...apiVariables,
        [key]: value,
      };
    }
  }
  return omitDeepBy(apiVariables, isUndefined);
}

export type useQueryFilterReturnType<S extends z.ZodObject<z.ZodRawShape>, GQLQueryVars, FilterMeta = unknown> = {
  values: z.infer<S>;
  variables: Partial<GQLQueryVars>;
  resetFilters: resetFilters<z.infer<S>>;
  setFilter: SetFilter<z.infer<S>>;
  setFilters: SetFilters<z.infer<S>>;
  hasFilters: boolean;
  activeViewId?: string;
  filters: FilterComponentConfigs<z.infer<S>>;
  views?: readonly View<z.infer<S>>[];
  meta?: FilterMeta;
  defaultSchemaValues: Partial<z.infer<S>>;
  lockViewFilters?: boolean;
};

type useQueryFilterOptions<S extends z.ZodObject<z.ZodRawShape>, GQLQueryVars, FilterMeta> = {
  schema: S; // Schema for all query filters (both those which are available to the user in Query and those which are not)
  filters: FilterComponentConfigs<z.infer<S>, FilterMeta>; // Configuration of filters available to the user in the `Filter` component (used in this hook to determine `hasFilters` and `activeViewId`)
  toVariables?: Partial<FiltersToVariables<z.infer<S>, GQLQueryVars, FilterMeta>>;
  defaultFilterValues?: Partial<z.infer<S>>; // Default valuFes for filters, views[0].filter will be used if not set
  meta?: FilterMeta;
  views?: readonly View<z.infer<S>>[];
  skipRouter?: boolean; // Used when not updating the URL query is desired, this will instead use internal state.
  activeViewId?: string; // To use as a control for the active view
  shallow?: boolean; // If true, the router will not reload the page when updating the query
  skipFiltersOnReset?: string[];
  lockViewFilters?: boolean; // If true, the view will lock the filters defined in the view, but you're able to add more filters without "leaving" the view
};

export default function useQueryFilter<S extends z.ZodObject<z.ZodRawShape>, GQLQueryVars, FilterMeta = unknown>(
  opts: useQueryFilterOptions<S, GQLQueryVars, FilterMeta>,
): useQueryFilterReturnType<S, GQLQueryVars, FilterMeta> {
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
  const defaultSchemaValues = React.useMemo(() => opts.schema.parse({}), [opts.schema]);

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
  }, [opts.schema, defaultFilterValues, defaultSchemaValues, query, stateQuery, intl]);

  const variables = React.useMemo(() => {
    let apiVariables: Partial<GQLQueryVars> = {};

    // Iterate over each entry in the values object
    for (const [key, value] of Object.entries(omitBy(values, isUndefined))) {
      // If a specific toVariables function exists for this key, use it
      if (opts.toVariables?.[key]) {
        apiVariables = {
          ...apiVariables,
          ...opts.toVariables[key](value, key, opts.meta, values),
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
      const filtersToKeep = pick(values, opts.skipFiltersOnReset);
      const result = opts.schema.safeParse({ ...filtersToKeep, ...newFilters });

      console.log({newFilters, filtersToKeep, result})
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
              filterName === 'status',
            ),
          }),
          filterValues,
        );
        console.log({queryWithReplacementsForDefaults, defaultFilterValues, defaultSchemaValues})
        const destructuredQueryValues = destructureFilterValues(queryWithReplacementsForDefaults);
        console.log({destructuredQueryValues})

        if (opts.skipRouter && !newPath) {
          setStateQuery(destructuredQueryValues);
        } else {
          const query = omitBy(destructuredQueryValues, isUndefined);
          const basePath = newPath || router.asPath.split('?')[0];

          router.push(
            {
              pathname: basePath,
              query,
            },
            null,
            { scroll: false, shallow: opts.shallow || false },
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
    () =>
      !isEmpty(
        omitBy(opts.filters, (v, key) => values[key] === defaultSchemaValues[key] || ['orderBy', 'sort'].includes(key)),
      ),
    [values, opts.filters, defaultSchemaValues],
  );

  const activeViewId = React.useMemo(
    () =>
      opts.activeViewId ||
      getActiveViewId(values, {
        filters: opts.filters,
        views: opts.views,
        defaultSchemaValues,
        lockViewFilters: opts.lockViewFilters,
      }),
    [values, opts.filters, opts.views, opts.activeViewId, defaultSchemaValues, opts.lockViewFilters],
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
    lockViewFilters: opts.lockViewFilters,
  };
}

function addFilterValidationErrorToast(error, intl) {
  let errorMessage = '';

  forEach(error.errors, error => {
    errorMessage = `${errorMessage} ${error.path.join(', ')}: ${error.message} \n`;
  });

  // Use setTimeout instead of setImmediate to avoid hydration mismatch
  // setImmediate is Node.js only and causes client/server differences
  setTimeout(() => {
    toast({
      variant: 'error',
      title: intl.formatMessage({ defaultMessage: 'Filter validation error', id: 'thZrl7' }),
      message: errorMessage,
    });
  }, 0);
}

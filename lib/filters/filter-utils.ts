import { forOwn, isEqual, isPlainObject, isUndefined, omitBy, setWith } from 'lodash';

/* 
  Will take values in a flat object and if the key has structure of `key[subkey]` turn those into nested objects
  Example, from this:
  {
    'date[gte]': '2020-01-01',
    'date[lte]': '2023-12-31',
    'status': 'ACTIVE',
  }
  into this:
  {
    date: {
      gte: '2020-01-01',
      lte: '2023-12-31',
    },
    status: 'ACTIVE',
  ]
*/
export function structureQueryValues(queryValues) {
  const nestedValues = {};

  forOwn(queryValues, (value, key) => {
    // Check and extract 'mainKey' and 'subKey' from a structured key format 'mainKey[subKey]'
    const match = key.match(/^(\w+)\[(\w+)]$/);

    if (match) {
      const [, mainKey, subKey] = match;
      setWith(nestedValues, [mainKey, subKey], value, Object);
    } else {
      nestedValues[key] = value;
    }
  });

  return nestedValues;
}

/* 
  Will take values in the form of nested objects and turn them into a flat object with keys in the form of `key[subkey]`
  Example, from this:
  {
    date: {
      gte: '2020-01-01',
      lte: '2023-12-31',
    },
    status: ['ACTIVE', 'CANCELED'],
  }
  into this:
  {
    'date[gte]': '2020-01-01',
    'date[lte]': '2023-12-31',
    'status': ['ACTIVE', 'CANCELED'],
  }
*/

export function destructureFilterValues(values: { [key: string]: any }): { [key: string]: string | string[] } {
  const flatValues = {};

  forOwn(values, (value, key) => {
    if (isPlainObject(value)) {
      forOwn(value, (subValue, subKey) => {
        flatValues[`${key}[${subKey}]`] = subValue;
      });
    } else {
      flatValues[key] = value;
    }
  });

  return flatValues;
}

// Fallback value to use in the URL query when the filter value is undefined but there is a default value from the view
const ALL = 'ALL';

export function getQueryValueFromFilterValue(filterValue, defaultFilterValue, defaultSchemaValue) {
  // If the filter value being set is undefined (i.e. the intention is to clear the filter) but there is a default filter from `defaultFilterValues`
  // then we need to set something in the query string, otherwise the default "user configured" value will be set when reading the router query.
  // Use the defaultSchemaValue if it exists, otherwise use 'ALL' as the default value.
  if (isUndefined(filterValue) && !isUndefined(defaultFilterValue)) {
    return defaultSchemaValue ?? ALL;

    // If the filterValue is equal to the default value from the schema, then we can omit it from the query string
    // (if it's also not in the user configured default values)
  } else if (filterValue === defaultSchemaValue && isUndefined(defaultFilterValue)) {
    return undefined;
  } else {
    return filterValue;
  }
}

export function getFilterValueFromQueryValue(queryValue, defaultFilterValue) {
  if (queryValue === ALL) {
    return undefined;
  } else if (isUndefined(queryValue)) {
    return defaultFilterValue;
  } else {
    return queryValue;
  }
}

export const filterShouldDisplay = (key, { values, filters, defaultSchemaValues, meta }) => {
  return (
    key !== 'orderBy' && // orderBy is handled separately
    key !== 'sort' && // sort is handled separately
    filters[key].hide?.({ meta }) !== true && // hide function should return false if it exists
    (filters[key].static || // static filters should always be displayed
      values[key] !== defaultSchemaValues[key]) // don't show default schema values (will either be undefined or a value that can't be removed)
  );
};

export const filterShouldBeInAddFilterOptions = (key, { values, filters, defaultSchemaValues, meta }) =>
  (isUndefined(values[key]) || // the value of the filter should be undefined (otherwise it should render)
    values[key] === defaultSchemaValues[key]) && // OR equal to the default value
  filters[key].hide?.({ meta }) !== true && // hide function should return false if it exists
  !filters[key].static && // should not be static (otherwise it should render)
  filters[key].Component; // should have a Component (otherwise no filter options available)

const omitForViewMatching = (values, { filters, defaultSchemaValues }) => {
  return omitBy(
    values,
    (value, key) =>
      !filters[key] || // only match values that are part of the `filters` config
      key === 'orderBy' || // don't match orderBy (to keep the view active regardless of sorting)
      key === 'sort' || // don't match sort (to keep the view active regardless of sorting)
      value === defaultSchemaValues[key], // remove value from view matching if it is the default schema value
  );
};

export const getActiveViewId = (values, { filters, views, defaultSchemaValues }) => {
  const currentViewValues = omitForViewMatching(values, { filters, defaultSchemaValues });

  const matchingView = views?.find(v => {
    const viewFilters = omitForViewMatching(v.filter, { filters: filters, defaultSchemaValues });
    return isEqual(viewFilters, currentViewValues);
  });
  return matchingView?.id;
};

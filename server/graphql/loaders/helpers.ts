import { get } from 'lodash';
import DataLoader from 'dataloader';

/** A default getter that returns item's id */
const defaultKeyGetter = (item): number | string => item.id;

/**
 * A newer implementation of `sortResults`.
 *
 * Sort the `results` according to `keys` order.
 *
 * @param keys: the keys to use as a reference for sorting (usually a list of ids)
 * @param results: the results as a list of entities
 * @param getKeyFromResult: a function to get the id to match keys
 * @param defaultValue: a default value used when there's no result in `results`
 */
export function sortResultsSimple<ResultType>(
  keys: readonly (string | number)[],
  results: readonly ResultType[],
  getKeyFromResult = defaultKeyGetter,
  defaultValue: ResultType = undefined,
): ResultType[] {
  const resultsById = {};
  results.forEach(item => {
    const id = getKeyFromResult(item);
    if (id) {
      resultsById[id] = item;
    }
  });

  return keys.map(id => resultsById[id] || defaultValue);
}

/**
 * Similar to `sortResultsSimple`, but stack items in arrays to allow storing multiple
 * results for each key.
 *
 * @param keys: the keys to use as a reference for sorting (usually a list of ids)
 * @param results: the results as a list of entities
 * @param getKeyFromResult: a function to get the id to match keys
 * @param defaultValue: a default value used when there's no result in `results`
 */
export function sortResultsArray<ResultType>(
  keys: readonly (string | number)[],
  results: readonly ResultType[],
  getKeyFromResult = defaultKeyGetter,
  defaultValue = [],
): ResultType[][] {
  const resultsById = {};
  results.forEach(item => {
    const id = getKeyFromResult(item);
    if (id) {
      if (resultsById[id]) {
        resultsById[id].push(item);
      } else {
        resultsById[id] = [item];
      }
    }
  });

  return keys.map(id => resultsById[id] || defaultValue);
}

/**
 * @deprecated Prefer to use `simpleSortResults`.
 *
 * The legacy implementation of `sortResults`. Provides a complex mechanism for using sub-fields
 * for attributes with `:` which not standard nor documented. There's also some magic happening
 * if you pass an Array as defaultValue.
 *
 * Sort the `results` according to `keys` order.
 *
 * @param keys: the keys to use as a reference for sorting (usually a list of ids)
 * @param results: the results as a list of entities
 * @param attribute: the attribute to use to get the key
 * @param defaultValue: a default value used when there's no result in `results`
 */
export const sortResults = (
  keys: readonly any[],
  results: readonly any[],
  attribute = 'id',
  defaultValue = undefined,
) => {
  const resultsById = {};
  results.forEach(r => {
    let key;
    const dataValues = r.dataValues || r;
    if (attribute.indexOf(':') !== -1) {
      const keyComponents = [];
      attribute.split(':').forEach(attr => {
        keyComponents.push(dataValues[attr]);
      });
      key = keyComponents.join(':');
    } else {
      key = get(dataValues, attribute);
    }
    if (!key) {
      return;
    }
    // If the default value is an array
    // e.g. when we want to return all the paymentMethods for a list of collective ids.
    if (defaultValue instanceof Array) {
      resultsById[key] = resultsById[key] || [];
      resultsById[key].push(r);
    } else {
      resultsById[key] = r;
    }
  });
  return keys.map(id => resultsById[id] || defaultValue);
};

type TBatchFunction = (values: readonly any[], options: any) => any;

/**
 * Add some caching to a dataloader
 */
export const createDataLoaderWithOptions = (
  batchFunction: TBatchFunction,
  cache: any,
  options = {},
  cacheKeyPrefix = '',
) => {
  const cacheKey = `${cacheKeyPrefix}:${JSON.stringify(options)}`;
  cache[cacheKey] = cache[cacheKey] || new DataLoader(keys => batchFunction(keys, options));
  return cache[cacheKey];
};

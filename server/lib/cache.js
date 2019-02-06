import md5 from 'md5';
import { getProvider } from './cacheProvider';
import models from '../models';

const cache = getProvider();
const oneDayInSeconds = 60 * 60 * 24;

export async function fetchCollectiveId(collectiveSlug) {
  const cacheKey = `collective_id_with_slug_${collectiveSlug}`;
  const collectiveId = await cache.get(cacheKey);
  if (collectiveId) {
    return collectiveId;
  }
  const collective = await models.Collective.findOne({
    attributes: ['id'],
    where: { slug: collectiveSlug.toLowerCase() },
  });
  cache.set(cacheKey, collective.id, oneDayInSeconds);
  return collective.id;
}

export function memoize(func, { key, maxAge = 0, serialize, unserialize }) {
  const cacheKey = args => {
    return args.length ? `${key}_${md5(JSON.stringify(args))}` : key;
  };

  const memoizedFunction = async function() {
    let value = await cache.get(cacheKey(arguments), { unserialize });
    if (value === undefined) {
      value = await func(...arguments);
      cache.set(cacheKey(arguments), value, maxAge, { serialize });
    }
    return value;
  };

  memoizedFunction.refresh = async function() {
    const value = await func(...arguments);
    cache.set(cacheKey(arguments), value, maxAge, { serialize });
  };

  memoizedFunction.clear = async function() {
    cache.del(cacheKey(arguments));
  };

  return memoizedFunction;
}

export default cache;

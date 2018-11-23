import LRU from 'lru-cache';
import models from '../models';
import debug from 'debug';

const cache = LRU({
  max: 1000,
  maxAge: 1000 * 60 * 60 * 24, // we keep it max 1d
});

/** Reset cache mostly for tests */
export function clearCache() {
  cache.reset();
}

export async function fetchCollectiveId(collectiveSlug) {
  const collectiveId = cache.get(collectiveSlug);
  if (collectiveId) return collectiveId;

  const collective = await models.Collective.findOne({
    attributes: ['id'],
    where: { slug: collectiveSlug.toLowerCase() },
  });

  debug('cache')(
    'setting collective id for ',
    collectiveSlug,
    'to',
    collective.id,
  );
  cache.set(collectiveSlug, collective.id);
  return collective.id;
}

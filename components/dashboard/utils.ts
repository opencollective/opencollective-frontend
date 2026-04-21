import { compact, omit } from 'lodash';
import type { NextRouter } from 'next/router';

const getRoutingOptions = (router: NextRouter, subpath) => ({
  pathname: compact([router.pathname, router.query.slug, router.query.section, subpath]).join('/'),
  query: omit(router.query, ['slug', 'section', 'subpath']),
});

export const makePushSubpath = (router: NextRouter) => subpath =>
  router.push(getRoutingOptions(router, subpath), undefined, {
    shallow: true,
    scroll: true,
  });

export const makeReplaceSubpath = (router: NextRouter) => subpath => {
  router.replace(getRoutingOptions(router, subpath), undefined, {
    shallow: true,
    scroll: true,
  });
};

import { compact, omit } from 'lodash';
import type { NextRouter } from 'next/router';

export const makePushSubpath = (router: NextRouter) => subpath => {
  router.push(
    {
      pathname: compact([router.pathname, router.query.slug, router.query.section, subpath]).join('/'),
      query: omit(router.query, ['slug', 'section', 'subpath']),
    },
    undefined,
    {
      shallow: true,
      scroll: true,
    },
  );
};

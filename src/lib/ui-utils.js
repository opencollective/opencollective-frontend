/**
 * A set of helpers to use for UI, rendering, or animations.
 */

import { debounce } from 'lodash';

/**
 * A debouncer for scroll functions. It is configured to trigger on trailing and
 * leading calls with a max wait of 100 to ensure everything stays responsive.
 */
export const debounceScroll = func => {
  return debounce(func, 200, {
    maxWait: 100,
    leading: true,
    trailing: true,
  });
};

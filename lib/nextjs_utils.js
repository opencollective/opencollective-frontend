/**
 * Define some helpers to deal with NextJS.
 */

/**
 * When called from server-side code, this function throws an error that
 * NextJS will translate to a 404, rendering the `pages/_error.js` with
 * the proper status code set.
 *
 * When called from client-side, this function does nothing.
 *
 * Check [this link](https://github.com/zeit/next.js/issues/4451#issuecomment-391116035)
 * for more information.
 *
 */
export const ssrNotFoundError = () => {
  // if (!process.browser) {
  //   const err = new Error('NOT_FOUND');
  //   err.code = 'ENOENT';
  //   throw err;
  // }
};

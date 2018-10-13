/**
 * Check if given `slug` could conflict with existing routes or
 * if it's a reserved keyword.
 *
 * The list is mostly based on frontend `src/server/pages.js` file and
 * `src/pages/static` content.
 *
 * @param {String} slug
 */
export function isBlacklistedCollectiveSlug(slug) {
  return [
    'about',
    'chapters',
    'create',
    'discover',
    'faq',
    'hosts',
    'learn-more',
    'opensource',
    'privacypolicy',
    'redeem',
    'redeemed',
    'search',
    'signin',
    'subscriptions',
    'tos',
    'widgets',
  ].includes(slug);
}

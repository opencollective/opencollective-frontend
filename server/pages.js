/**
 * Configure the router.
 *
 * /!\ You'll have to restart your local dev server after any change to this file.
 */

const routes = require('next-routes');

const pages = routes();

// Marketing Pages
// ---------------

pages.add('marketing', '/:pageSlug(how-it-works|gift-of-giving|gift-cards|pricing|old-pricing)', 'marketingPage');

// Collective
// ----------

// Collective page
pages.add('collective', '/:slug', 'collective-page');
pages.add(
  'collective-with-onboarding',
  '/:slug/:mode(onboarding)?/:step(administrators|contact|success)?',
  'collective-page',
);

// New accept financial contributions flow
pages.add(
  'accept-financial-contributions',
  '/:slug/accept-financial-contributions/:path(ourselves|myself|organization|host)?/:method(stripe|bank)?/:state(success)?',
);

// New recurring contributions page
pages.add('recurring-contributions', '/:slug/recurring-contributions');
pages.add('subscriptions', '/:slug/subscriptions', 'recurring-contributions');

module.exports = pages;

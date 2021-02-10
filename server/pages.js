/**
 * Configure the router.
 *
 * /!\ You'll have to restart your local dev server after any change to this file.
 */

const routes = require('next-routes');

const pages = routes()
  .add('confirmEmail', '/confirm/email/:token')
  .add('confirm-guest', '/confirm/guest/:token')
  .add('unsubscribeEmail', '/email/unsubscribe/:email/:slug/:type/:token')
  .add('create-account', '/:form(create-account)', 'signin')
  .add('button', '/:collectiveSlug/:verb(contribute|donate)/button')
  .add('createEvent', '/:parentCollectiveSlug/events/(new|create)')
  .add('create-project', '/:parentCollectiveSlug/projects/(new|create)')
  .add('editEvent', '/:parentCollectiveSlug/events/:eventSlug/edit/:section?')
  .add('editCollective', '/:slug/edit/:section?')
  .add('collective-contact', '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/contact')
  .add('host.expenses', '/:hostCollectiveSlug/collectives/expenses', 'host.dashboard')
  .add(
    'host.dashboard',
    '/:hostCollectiveSlug/dashboard/:view(expenses|pending-applications|hosted-collectives|donations)?',
    'host.dashboard',
  )
  .add('transactions', '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/transactions')
  .add('create-expense', '/:parentCollectiveSlug?/:type(events|projects)?/:collectiveSlug/expenses/new')
  .add(
    'expense-v2',
    '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/expenses/:ExpenseId([0-9]+)/:version(v2)?',
    'expense',
  )
  .add(
    'expenses',
    '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/expenses/:version(v2)?',
    'expenses',
  )
  .add('orders', '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/orders')
  .add('order', '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/orders/:OrderId([0-9]+)')
  .add('confirmOrder', '/orders/:id([0-9]+)/confirm');

pages.add('create-fund', '/fund/:verb(apply|create)/:step(form)?');

// New Create Collective Flow
pages.add(
  'create-collective',
  '/:hostCollectiveSlug?/:verb(apply|create)/:version(v2)?/:category(opensource|community|climate|covid-19)?/:step(form)?',
);

// Events and Projects using collective page
pages.add('event', '/:parentCollectiveSlug/events/:slug', 'collective-page');
pages.add('project', '/:parentCollectiveSlug/projects/:slug', 'collective-page');

// Tier page
// ---------------
pages.add('contribute', '/:collectiveSlug/:verb(tiers|contribute)');
pages.add('tier', '/:collectiveSlug/:verb(tiers|contribute)/:tierSlug?-:tierId([0-9]+)');

// Conversations
// ---------------
pages.add('conversations', '/:collectiveSlug/conversations');
pages.add('create-conversation', '/:collectiveSlug/conversations/new');
pages.add('conversation', '/:collectiveSlug/conversations/:slug?-:id([a-z0-9]+)');

// Contribute Flow
// ---------------

const createOrderPage = 'contribution-flow';
const contributionFlowSteps = 'profile|details|payment|summary|success';

// Legacy create order route. Deprectated on 2019-02-12
pages.add(
  'orderCollectiveTier',
  '/:collectiveSlug/:verb(order)/:tierId/:amount(\\d+)?/:interval(month|monthly|year|yearly)?',
  createOrderPage,
);

// Legacy tier route. Deprectated on 2019-06-07
pages.add(
  'orderCollectiveTierLegacy',
  `/:collectiveSlug/:verb(donate|pay|contribute|order|events)/tier/:tierId-:tierSlug?/:step(${contributionFlowSteps})?`,
  createOrderPage,
);

// New Routes -> New flow
pages
  .add(
    'orderCollectiveNew',
    `/:collectiveSlug/:verb(donate|pay|order|events)/:step(${contributionFlowSteps})?`,
    createOrderPage,
  )
  .add(
    'orderCollectiveTierNew',
    `/:collectiveSlug/:verb(contribute)/:tierSlug?-:tierId([0-9]+)/checkout/:step(${contributionFlowSteps})?`,
    createOrderPage,
  );

// Generic Route
pages.add(
  'orderCollective',
  '/:collectiveSlug/:verb(donate|pay|order|events)/:amount(\\d+)?/:interval(month|monthly|year|yearly)?/:description?',
  createOrderPage,
);

// Events
pages.add(
  'orderEventTier',
  `/:collectiveSlug/:verb(events|projects)/:eventSlug/order/:tierId/:step(${contributionFlowSteps})?`,
  createOrderPage,
);

// Pledges
// -------

pages.add('createPledge', '/pledges/new').add('createCollectivePledge', '/:slug/pledges/new', 'createPledge');

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

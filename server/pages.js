/**
 * Configure the router.
 *
 * /!\ You'll have to restart your local dev server after any change to this file.
 */

const routes = require('next-routes');

const pages = routes()
  .add('home', '/', 'index')
  .add('static', '/:pageSlug(widgets|tos|privacypolicy|support|hiring)', 'staticPage')
  .add('pricing', '/pricing', 'pricing')
  .add('redeem', '/:collectiveSlug?/redeem/:code?')
  .add('redeemed', '/:collectiveSlug?/redeemed/:code?')
  .add('updatePaymentMethod', '/:collectiveSlug/paymentmethod/:id/update')
  .add('signinLinkSent', '/signin/sent')
  .add('confirmCollectiveDeletion', '/deleteCollective/confirmed')
  .add('signin', '/signin/:token?')
  .add('confirmEmail', '/confirm/email/:token')
  .add('unsubscribeEmail', '/email/unsubscribe/:email/:slug/:type/:token')
  .add('create-account', '/:form(create-account)', 'signin')
  .add('test-errors', '/test-errors')
  .add('subscriptions_redirect', '/subscriptions', 'subscriptions-redirect')
  .add('search', '/search')
  .add('hosts', '/hosts')
  .add('button', '/:collectiveSlug/:verb(contribute|donate)/button')
  .add('createEvent', '/:parentCollectiveSlug/events/(new|create)')
  .add('openSourceApply', '/opensource/(apply|create)/:version(v1|legacy)')
  .add('createCollective', '/:hostCollectiveSlug?/(apply|create)/:version(v1|legacy)')
  .add('createOrganization', '/organizations/new')
  .add('events-iframe', '/:collectiveSlug/events.html')
  .add('collectives-iframe', '/:collectiveSlug/(collectives|widget).html')
  .add('banner-iframe', '/:collectiveSlug/banner.html')
  .add('editEvent', '/:parentCollectiveSlug/events/:eventSlug/edit/:section?')
  .add('editCollective', '/:slug/edit/:section?')
  .add('events', '/:collectiveSlug/events')
  .add('collective-contact', '/:parentCollectiveSlug?/:collectiveType(events)?/:collectiveSlug/contact')
  .add('subscriptions', '/:collectiveSlug/subscriptions')
  .add('host.expenses', '/:hostCollectiveSlug/collectives/expenses', 'host.dashboard')
  .add(
    'host.dashboard',
    '/:hostCollectiveSlug/dashboard/:view(expenses|pending-applications|donations)?',
    'host.dashboard',
  )
  .add(
    'host.expenses.approve',
    '/:parentCollectiveSlug?/:collectiveType(events)?/:collectiveSlug/:table(expenses)/:id/:action(approve|reject)',
    'action',
  )
  .add('host.collectives.approve', '/:hostCollectiveSlug/:table(collectives)/:id/:action(approve)', 'action')
  .add('transactions', '/:parentCollectiveSlug?/:collectiveType(events)?/:collectiveSlug/transactions')
  .add('createUpdate', '/:collectiveSlug/updates/new')
  .add('updates', '/:collectiveSlug/updates')
  .add('update', '/:collectiveSlug/updates/:updateSlug')
  .add('createExpense', '/:parentCollectiveSlug?/:type(events)?/:collectiveSlug/expenses/new')
  .add('create-expense', '/:parentCollectiveSlug?/:type(events)?/:collectiveSlug/expenses/new-v2')
  .add(
    'expense-v2',
    '/:parentCollectiveSlug?/:collectiveType(events)?/:collectiveSlug/expenses/:ExpenseId([0-9]+)/v2',
    'expense',
  )
  .add(
    'expense',
    '/:parentCollectiveSlug?/:collectiveType(events)?/:collectiveSlug/expenses/:ExpenseId([0-9]+)',
    'expense-legacy',
  )
  .add(
    'expenses',
    '/:parentCollectiveSlug?/:collectiveType(events)?/:collectiveSlug/expenses/:filter(categories|recipients)?/:value?',
  )
  .add('orders', '/:parentCollectiveSlug?/:collectiveType(events)?/:collectiveSlug/orders')
  .add('order', '/:parentCollectiveSlug?/:collectiveType(events)?/:collectiveSlug/orders/:OrderId([0-9]+)')
  .add('confirmOrder', '/orders/:id([0-9]+)/confirm')
  .add('markOrderAsPaid', '/orders/:id([0-9]+)/mark-as-paid')
  .add('discover', '/discover')
  .add('member-invitations', '/member-invitations');

// New Create Collective Flow
pages.add(
  'create-collective',
  '/:hostCollectiveSlug?/:verb(apply|create)/:version(v2)?/:category(opensource|community|climate)?/:step(form)?',
  'new-create-collective',
);
// temporary onboarding modal page
pages.add('new-collective-onboarding-modal', '/:slug/onboarding/:step(administrators|contact)?');

// Events using new collective page
pages.add('event', '/:parentCollectiveSlug/events/:eventSlug', 'new-collective-page');
pages.add('legacy-event', '/:parentCollectiveSlug/events/:eventSlug/legacy', 'event');

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

// Legacy create order route. Deprectated on 2019-02-12
pages.add(
  'orderCollectiveTier',
  '/:collectiveSlug/:verb(order)/:tierId/:amount(\\d+)?/:interval(month|monthly|year|yearly)?',
  'createOrder',
);

// Legacy tier route. Deprectated on 2019-06-07
pages
  .add(
    'orderCollectiveTierLegacy',
    '/:collectiveSlug/:verb(donate|pay|contribute|order|events)/tier/:tierId-:tierSlug?/:step(contributeAs|details|payment|summary)?',
    'createOrder',
  )
  .add(
    'orderCollectiveTierLegacySuccess',
    '/:collectiveSlug/:verb(donate|pay|contribute|order|events)/tier/:tierId-:tierSlug?/:step(success)',
    'orderSuccess',
  );

// New Routes -> New flow
pages
  .add(
    'orderCollectiveNew',
    '/:collectiveSlug/:verb(donate|pay|order|events)/:step(contributeAs|details|payment|summary)?',
    'createOrder',
  )
  .add(
    'orderCollectiveTierNew',
    '/:collectiveSlug/:verb(contribute)/:tierSlug?-:tierId([0-9]+)/checkout/:step(contributeAs|details|payment|summary)?',
    'createOrder',
  )
  .add('orderCollectiveNewSuccess', '/:collectiveSlug/:verb(donate|pay|order|events)/:step(success)', 'orderSuccess')
  .add(
    'orderCollectiveTierNewSuccess',
    '/:collectiveSlug/:verb(contribute)/:tierSlug?-:tierId([0-9]+)/checkout/:step(success)',
    'orderSuccess',
  );

// Generic Route
pages.add(
  'orderCollective',
  '/:collectiveSlug/:verb(donate|pay|order|events)/:amount(\\d+)?/:interval(month|monthly|year|yearly)?/:description?',
  'createOrder',
);

// Events
pages.add(
  'orderEventTier',
  '/:collectiveSlug/:verb(events)/:eventSlug/order/:tierId/:step(contributeAs|details|payment|summary)?',
  'createOrder',
);

// Events
pages.add(
  'orderEventTierSuccess',
  '/:collectiveSlug/:verb(events)/:eventSlug/order/:tierId/:step(success)',
  'orderSuccess',
);

// Pledges
// -------

pages
  .add('createPledge', '/pledges/new')
  .add('createCollectivePledge', '/:slug/pledges/new', 'createPledge')
  .add('completePledge', '/pledges/:orderId/:step(contributeAs|details|payment|summary)?')
  .add('claimCollective', '/:collectiveSlug/claim');

// Application management
// ----------------------

pages.add('applications', '/applications');

// Marketing Pages
// ---------------

pages.add(
  'marketing',
  '/:pageSlug(become-a-sponsor|how-it-works|gift-of-giving|gift-cards|pricing|become-a-fiscal-host)',
  'marketingPage',
);

// Collective
// ----------

// New collective page - we keep the v2 alias because we shared some of these URLs by email
pages.add('new-collective-page', '/:slug/v2');

// Collective page
pages.add('collective', '/:slug', 'new-collective-page');
pages.add('legacy-collective-page', '/:slug/legacy', 'collective');

module.exports = pages;

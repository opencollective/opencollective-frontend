import nextRoutes from 'next-routes';
import { getEnvVar, parseToBoolean } from '../lib/utils';

const pages = nextRoutes();

pages
  .add('home', '/')
  .add('about', '/:pageSlug(about|widgets|tos|privacypolicy)', 'staticPage')
  .add(
    'faq',
    '/:path(faq)/:pageSlug(about|collectives|backers|expenses|hosts|becoming-an-open-collective-host)?',
    'staticPage',
  )
  .add('redeem', '/redeem/:code?')
  .add('redeemed', '/redeemed/:code?')
  .add('signinLinkSent', '/signin/sent')
  .add('signin', '/signin/:token?')
  .add('subscriptions_redirect', '/subscriptions', 'subscriptions-redirect')
  .add('search', '/search')
  .add('hosts', '/hosts')
  .add('createHost', '/:collectiveSlug/connect/stripe')
  .add('button', '/:collectiveSlug/:verb(contribute|donate)/button')
  .add('createEvent', '/:parentCollectiveSlug/events/(new|create)')
  .add('createCollective', '/:hostCollectiveSlug?/(apply|create)')
  .add('createOrganization', '/organizations/new')
  .add('events-iframe', '/:collectiveSlug/events.html')
  .add('collectives-iframe', '/:collectiveSlug/(collectives|widget).html')
  .add('banner-iframe', '/:collectiveSlug/banner.html')
  .add('event', '/:parentCollectiveSlug/events/:eventSlug')
  .add('editEvent', '/:parentCollectiveSlug/events/:eventSlug/edit')
  .add('editCollective', '/:slug/edit/:section?')
  .add('events', '/:collectiveSlug/events')
  .add('subscriptions', '/:collectiveSlug/subscriptions')
  .add('tiers-iframe', '/:collectiveSlug/tiers/iframe')
  .add('host.expenses', '/:hostCollectiveSlug/collectives/expenses', 'host.dashboard')
  .add('host.dashboard', '/:hostCollectiveSlug/dashboard', 'host.dashboard')
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
  .add('expense', '/:parentCollectiveSlug?/:collectiveType(events)?/:collectiveSlug/expenses/:ExpenseId([0-9]+)')
  .add(
    'expenses',
    '/:parentCollectiveSlug?/:collectiveType(events)?/:collectiveSlug/expenses/:filter(categories|recipients)?/:value?',
  )
  .add('orders', '/:parentCollectiveSlug?/:collectiveType(events)?/:collectiveSlug/orders')
  .add('order', '/:parentCollectiveSlug?/:collectiveType(events)?/:collectiveSlug/orders/:OrderId([0-9]+)')
  .add('discover', '/discover');

// Contribute Flow
// ---------------

const createOrderPage = parseToBoolean(getEnvVar('USE_NEW_CREATE_ORDER')) ? 'createOrderNewFlow' : 'createOrder';

// Generic Route -> Feature Flag
pages.add('orderCollective', '/:collectiveSlug/:verb(donate|pay|contribute)', createOrderPage);

// Special route to force New Flow
pages.add('orderCollectiveNewForce', '/:collectiveSlug/:verb(donate|pay|contribute)/newFlow', 'createOrderNewFlow');

// Old Route -> Old Flow (should be handled by a redirect once feature flag is gone)
pages.add('orderCollectiveTier', '/:collectiveSlug/order/:TierId', 'createOrder');

// New Routes -> New flow
pages
  .add(
    'orderCollectiveNew',
    '/:collectiveSlug/:verb(donate|pay|contribute)/:step(contributeAs|details|payment)?',
    'createOrderNewFlow',
  )
  .add(
    'orderCollectiveTierNew',
    '/:collectiveSlug/:verb(donate|pay|contribute)/tier/:tierSlug/:step(contributeAs|details|payment)?',
    'createOrderNewFlow',
  )
  .add('orderCollectiveNewSuccess', '/:collectiveSlug/:verb(donate|pay|contribute)/success', 'orderSuccess')
  .add(
    'orderCollectiveTierNewSuccess',
    '/:collectiveSlug/:verb(donate|pay|contribute)/tier/:tierSlug/success',
    'orderSuccess',
  );

// New contribution flow not applied to events yet
pages.add('orderEventTier', '/:collectiveSlug/events/:eventSlug/order/:TierId', 'createOrder');

// Pledges
// -------

pages
  .add('createPledge', '/pledges/new')
  .add('createCollectivePledge', '/:slug/pledges/new', 'createPledge')
  .add('completePledge', '/pledges/:id')
  .add('claimCollective', '/:collectiveSlug/claim');

// Application management
// ----------------------

pages
  .add('applications', '/:collectiveSlug/applications')
  .add('createApplication', '/:collectiveSlug/applications/:type(apiKey|oauth)?/new')
  .add('editApplication', '/:collectiveSlug/applications/:applicationId/edit');

// Marketing Pages
// ---------------

pages.add(
  'marketing',
  '/:pageSlug(become-a-sponsor|how-it-works|gift-of-giving|gift-cards|gift-cards-next)',
  'marketingPage',
);

// Collective
// ----------

pages.add('collective', '/:slug');

export default pages;

export const { Link, Router } = pages;

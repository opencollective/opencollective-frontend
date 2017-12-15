import nextRoutes from 'next-routes';

const pages = nextRoutes();

pages
  .add('widgets', '/widgets')
  .add('tos', '/tos')
  .add('privacypolicy', '/privacypolicy')
  .add('redeem', '/redeem')
  .add('signin', '/signin/:token?')
  .add('button', '/:collectiveSlug/:verb(contribute|donate)/button')
  .add('createEvent', '/:parentCollectiveSlug/events/(new|create)')
  .add('createCollective', '/:hostCollectiveSlug/apply')
  .add('events-iframe', '/:collectiveSlug/events.html')
  .add('collectives-iframe', '/:collectiveSlug/collectives.html')
  .add('banner-iframe', '/:collectiveSlug/banner.html')
  .add('event', '/:parentCollectiveSlug/events/:eventSlug')
  .add('editEvent', '/:parentCollectiveSlug/events/:eventSlug/edit')
  .add('events', '/:collectiveSlug/events')
  .add('tiers', '/:collectiveSlug/tiers')
  .add('editTiers', '/:collectiveSlug/tiers/edit')
  .add('orderCollectiveTier', '/:collectiveSlug/order/:TierId/:amount?/:interval?', 'createOrder')
  .add('orderEventTier', '/:collectiveSlug/events/:eventSlug/order/:TierId', 'createOrder')
  .add('donate', '/:collectiveSlug/:verb(donate|pay|contribute)/:amount?/:interval(month|monthly|year|yearly)?/:description?', 'createOrder')
  .add('tiers-iframe', '/:collectiveSlug/tiers/iframe')
  .add('transactions', '/:collectiveSlug/transactions')
  .add('expenses', '/:collectiveSlug/expenses')
  .add('host.expenses', '/:hostCollectiveSlug/collectives/expenses')
  .add('host.expenses.approve', '/:collectiveSlug/:table(expenses)/:id/:action(approve|reject)', 'action')
  .add('host.collectives.approve', '/:hostCollectiveSlug/:table(collectives)/:id/:action(approve)', 'action')
  .add('nametags', '/:parentCollectiveSlug/events/:eventSlug/nametags')
  .add('collective', '/:slug')
  .add('editCollective', '/:slug/edit')

  module.exports = pages;
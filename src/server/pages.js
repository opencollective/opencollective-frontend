import nextRoutes from 'next-routes';

const pages = nextRoutes();

pages
  .add('signin', '/signin/:token?')
  .add('createEvent', '/:parentCollectiveSlug/events/(new|create)')
  .add('events-iframe', '/:parentCollectiveSlug/events/iframe')
  .add('event', '/:parentCollectiveSlug/events/:eventSlug')
  .add('editEvent', '/:parentCollectiveSlug/events/:eventSlug/edit')
  .add('events', '/:collectiveSlug/events')
  .add('tiers', '/:collectiveSlug/tiers')
  .add('editTiers', '/:collectiveSlug/tiers/edit')
  .add('orderTier', '/:collectiveSlug/order/:TierId/:amount?/:interval?')
  .add('donate', '/:collectiveSlug/:verb(order|donate|pay|contribute)/:amount?/:interval?')
  .add('tiers-iframe', '/:collectiveSlug/tiers/iframe')
  .add('transactions', '/:collectiveSlug/transactions')
  .add('nametags', '/:parentCollectiveSlug/events/:eventSlug/nametags')
  .add('button', '/:collectiveSlug/:verb(contribute|donate)/button')
  .add('collective', '/:slug')
  .add('editCollective', '/:slug/edit')

  module.exports = pages;
import nextRoutes from 'next-routes';

const pages = nextRoutes();

pages
  .add('profile', '/@:username')
  .add('createEvent', '/:collectiveSlug/events/(new|create)')
  .add('events-iframe', '/:collectiveSlug/events/iframe')
  .add('event', '/:collectiveSlug/events/:eventSlug')
  .add('editEvent', '/:collectiveSlug/events/:eventSlug/edit')
  .add('events', '/:collectiveSlug/events')
  .add('tiers', '/:collectiveSlug/tiers')
  .add('editTiers', '/:collectiveSlug/tiers/edit')
  .add('tier', '/:collectiveSlug/tiers/:tierId')
  .add('tiers-iframe', '/:collectiveSlug/tiers/iframe')
  .add('transactions', '/:collectiveSlug/transactions')
  .add('nametags', '/:collectiveSlug/events/:eventSlug/nametags')
  .add('button', '/:collectiveSlug/:verb(contribute|donate)/button');

module.exports = pages;
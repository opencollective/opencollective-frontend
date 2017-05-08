import nextRoutes from 'next-routes';
const routes = module.exports = nextRoutes();

routes.add('event', '/:collectiveSlug/events/:eventSlug');
routes.add('events', '/:collectiveSlug/events');
routes.add('events', '/');
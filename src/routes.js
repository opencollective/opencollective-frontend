const nextRoutes = require('next-routes');
const routes = module.exports = nextRoutes();

routes.add('event', '/:collectiveSlug/events/:eventSlug');
routes.add('button', '/:collectiveSlug/donate/button');
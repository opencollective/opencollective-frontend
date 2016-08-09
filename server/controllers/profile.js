/**
 * Controller.
 */
module.exports = function(app) {

  const models = app.set('models');
  const errors = app.errors;

  return (req, res, next) => {
    const slug = req.params.slug.toLowerCase();
    const controllers = req.app.set('controllers');

    // TODO use slugLib.js to get user or group
    models.Group
      .findOne({where: { slug }})
      .then((group) => {
        if (group) {
          req.group = group;
          return controllers.groups.getOne(req, res, next);
        } else {
          models.User.findOne({where: {username: slug}})
          .then((user) => {
            if (user) {
              req.user = user;
              req.query.profile = true;
              return controllers.users.show(req, res, next);
            } else {
              return next(new errors.NotFound(`There is no collective or user at this url /${slug}`));
            }
          })
        }
      });
  }
};

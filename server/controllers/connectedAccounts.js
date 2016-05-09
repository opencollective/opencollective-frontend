module.exports = (app) => {
  const errors = app.errors;
  const models = app.set('models');
  const ConnectedAccount = models.ConnectedAccount;
  const Group = models.Group;

  return {
    post: (req, res, next) => {
      const accessToken = req.body.accessToken;
      if (!accessToken) {
        return next(new errors.BadRequest("Access token not provided"));
      }
      const attrs = { provider: req.params.service };
      Group
        .findOne({
          where: { slug: req.params.slug },
          attributes: ['id']
        })
        .then(group => attrs.GroupId = group.id)
        // TODO should simplify using findOrCreate but need to upgrade Sequelize to have this fix:
        // https://github.com/sequelize/sequelize/issues/4631
        .then(() => ConnectedAccount.findOne({ where: attrs }))
        .then(ca => ca || ConnectedAccount.create(attrs))
        .then(ca => ca.update({ secret: accessToken }))
        .then(() => res.send({success: true}))
        .catch(next);
    }
  };
};

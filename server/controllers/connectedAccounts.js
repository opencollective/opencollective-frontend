module.exports = (app) => {
  const errors = app.errors;
  const models = app.set('models');
  const ConnectedAccount = models.ConnectedAccount;
  const users = require('../controllers/users')(app);

  return {
    post: (req, res, next) => {
      const accessToken = req.body.accessToken;
      const username = req.body.clientId;
      var email = req.body.email;
      if (!accessToken) {
        return next(new errors.BadRequest('Access Token not provided'));
      }

      var caId;
      if (!email) {
        // TODO: temporarily putting an email address in to get past "email can't be null" requirement
        email = `${username}.${req.params.service}@opencollective.com`;
      }
      users.getOrCreate(email, (err, user) => {
        if (err) return next(err);
        const attrs = { provider: req.params.service, UserId: user.id };
        ConnectedAccount
          // TODO should simplify using findOrCreate but need to upgrade Sequelize to have this fix:
          // https://github.com/sequelize/sequelize/issues/4631
          .findOne({ where: attrs})
          .then(ca => ca || ConnectedAccount.create(attrs))
          .then(ca => {
            caId = ca.id;
            return ca.update({username, secret: accessToken});
          })
          .then(() =>
            res.send({
              success: true,
              token: user.generateConnectedAccountVerifiedToken(req.application, caId, username)}))
          .catch(next);
      });
    },

    get: (req, res, next) => {
      const payload = req.jwtPayload;
      const provider = req.params.service;
      if (payload.scope === provider && payload.username) {
        res.send({provider, username: payload.username, connectedAccountId: payload.connectedAccountId})
      } else {
        return next(new errors.BadRequest('Github authorization failed'));
      }
    }
  };
};

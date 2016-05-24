const config = require('config');

module.exports = (app) => {
  const errors = app.errors;
  const models = app.get('models');
  const ConnectedAccount = models.ConnectedAccount;
  const User = models.User;


  return {
    createOrUpdate: (req, res, next, accessToken, profile, emails) => {
      var caId, user;
      const attrs = { provider: req.params.service };
      var avatar;
      if (req.params.service === 'github'){
        avatar = `http://avatars.githubusercontent.com/${profile.username}`;
      }

      // TODO should simplify using findOrCreate but need to upgrade Sequelize to have this fix:
      // https://github.com/sequelize/sequelize/issues/4631
      User.findOne({ where: { email: { $in: emails }}})
        .then(u => u || User.create({
          name: profile.displayName,
          avatar: avatar || profile.avatar_url,
          email: emails[0]
        }))
        .tap(u => user = u)
        .tap(user => attrs.UserId = user.id)
        .then(() => ConnectedAccount.findOne({ where: attrs }))
        .then(ca => ca || ConnectedAccount.create(attrs))
        .then(ca => {
          caId = ca.id;
          return ca.update({ username: profile.username, secret: accessToken });
        })
        .then(() => {
          const token = user.generateConnectedAccountVerifiedToken(req.application, caId, profile.username);
          res.redirect(`${config.host.website}/github/apply/${token}`);
        })
        .catch(next);
    },

    get: (req, res, next) => {
      const payload = req.jwtPayload;
      const provider = req.params.service;
      if (payload.scope === 'connected-account' && payload.username) {
        res.send({provider, username: payload.username, connectedAccountId: payload.connectedAccountId})
      } else {
        return next(new errors.BadRequest('Github authorization failed'));
      }
    }

  };
};

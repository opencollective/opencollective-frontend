/**
 * Controller.
 */
module.exports = function(app) {

  const email = require('../lib/email')(app);
  const models = app.set('models');
  const errors = app.errors;
  const Unauthorized = errors.Unauthorized;

  /**
   * Send an email with the new token
   */
  const sendTokenByEmail = (req, res, next) => {
    if (!req.jwtPayload || !req.remoteUser) {
      return next(new Unauthorized('Invalid payload'));
    }

    const user = req.remoteUser;

    email.send('user.new.token', req.remoteUser.email, {
      subscriptionsLink: user.generateSubscriptionsLink(req.application)
    })
    .then(() => res.send({ success: true }))
    .catch(next);
  };

  /**
   * Get subscriptions of a user
   */
  const getAll = (req, res, next) => {
    models.Subscription.findAll({
      include: [
        {
          model: models.Transaction,
          where: {
            UserId: req.remoteUser.id
          },
          include: [{ model: models.Group }]
        },
      ]
    })
    .then((subscriptions) => res.send(subscriptions))
    .catch(next)
  };

  /**
   * Public methods.
   */
  return {
    getAll,
    sendTokenByEmail
  };

};

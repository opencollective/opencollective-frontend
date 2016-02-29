/**
 * Controller.
 */
module.exports = function(app) {

  const  models = app.set('models');

  /**
   * Send an email with the new token
   */
  const sendTokenByEmail = (req, res) => {
    res.send(200);
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

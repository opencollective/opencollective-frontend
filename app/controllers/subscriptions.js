var errors = require('../lib/errors');

module.exports = function(app) {

  var models = app.set('models');
  var Subscription = models.Subscription;

  return {
    subscribe: function(req, res, next) {
      Subscription.create({
        UserId: req.remoteUser.id,
        GroupId: req.group.id,
        type: req.params.activityType
      })
      .catch(function(err) {
        if (err.name == 'SequelizeUniqueConstraintError')
          next(new errors.BadRequest('Already subscribed to this type of activity'));

        next(err);
      })
      .then(function(subscription) {
        if (subscription) {
          res.send(subscription.get({plain:true}));
        }
      });
    },

    unsubscribe: function(req, res, next) {
      Subscription.destroy({
        where: {
          UserId: req.remoteUser.id,
          GroupId: req.group.id,
          type: req.params.activityType
        }
      })
      .catch(function(err) {
        console.error('Error when deleting a subscription', err);
        next(err);
      })
      .then(function(deletedRows) {
        if (deletedRows == 0)
          return next(new errors.BadRequest('You were not subscribed to this type of activity'));
        if (deletedRows == 1)
          return res.sendStatus(200);
      });
    }
  }
}

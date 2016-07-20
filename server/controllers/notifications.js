const errors = require('../lib/errors');

module.exports = function(app) {

  const models = app.set('models');
  const Notification = models.Notification;

  return {
    subscribe: function(req, res, next) {
      Notification.create({
        UserId: req.remoteUser.id,
        GroupId: req.group.id,
        type: req.params.activityType
      })
      .then((notification) => {
        if (notification) {
          res.send(notification.get({plain:true}));
        }
      })
      .catch((err) => {
        if (err.name == 'SequelizeUniqueConstraintError')
          return next(new errors.BadRequest('Already subscribed to this type of activity'));

        next(err);
      });
    },

    unsubscribe: function(req, res, next) {
      Notification.destroy({
        where: {
          UserId: req.remoteUser.id,
          GroupId: req.group.id,
          type: req.params.activityType
        }
      })
      .catch((err) => {
        console.error('Error when deleting a notification', err);
        next(err);
      })
      .then((deletedRows) => {
        if (deletedRows === 0)
          return next(new errors.BadRequest('You were not subscribed to this type of activity'));
        if (deletedRows === 1)
          return res.sendStatus(200);
      });
    }
  }
}

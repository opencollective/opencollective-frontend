import models from '../models';
import errors from '../lib/errors';

const { Notification } = models;

export function subscribe(req, res, next) {
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
    if (err.name === 'SequelizeUniqueConstraintError')
      return next(new errors.BadRequest('Already subscribed to this type of activity'));

    next(err);
  });
}

export function unsubscribe(req, res, next) {
  Notification.findOne({
    where: {
      UserId: req.remoteUser.id,
      GroupId: req.group.id,
      type: req.params.activityType
    }
  })
  .then(notification => {
    if (!notification)
      return next(new errors.BadRequest('You were not subscribed to this type of activity'));

    notification.active = false;
    return notification.save();
  })
  .catch((err) => {
    console.error('Error when disabling a notification', err);
    next(err);
  })
  .then(() => {
    return res.sendStatus(200);
  });
}

export function unsubscribe(req, res, next) {
  req.remoteUser
    .unsubscribe(req.collective.id, req.params.activityType)
    .catch(err => {
      console.error('Error when disabling a notification', err);
      next(err);
    })
    .then(() => {
      return res.sendStatus(200);
    });
}

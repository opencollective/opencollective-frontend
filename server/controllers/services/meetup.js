/**
 * Dependencies.
 */
const Meetup = require('../../lib/meetup');

/**
 * Controller.
 */
module.exports = (app) => {

  const models = app.set('models');

  const sync = (req, res, next) => {
    req.group.users = req.users;
    models.ConnectedAccount
      .findOne({ where: { GroupId: req.group.id, provider: 'meetup' }})
      .then(meetupAccount => new Meetup(meetupAccount, req.group))
      .then(meetup => meetup.syncCollective())
      .then(result => {
          res.send(result);
      })
      .catch(next);
  }

  return { sync };

};
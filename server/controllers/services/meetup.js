import models from '../../models';
import Meetup from '../../lib/meetup';

export default function syncMeetup(req, res, next) {
  req.collective.users = req.users;
  const action = req.query.action || 'addHeader';
  models.ConnectedAccount.findOne({
    where: { CollectiveId: req.collective.id, service: 'meetup' },
  })
    .then(meetupAccount => new Meetup(meetupAccount, req.collective))
    .then(meetup => meetup.syncCollective(action))
    .then(result => res.send(result))
    .catch(next);
}

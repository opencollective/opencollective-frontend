import models from '../../models';
import Meetup from '../../lib/meetup';

export default function syncMeetup(req, res, next) {
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

import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import * as utils from '../test/utils';
import constants from '../server/constants/activities';
import models from '../server/models';
import roles from '../server/constants/roles';
import Promise from 'bluebird';

const application = utils.data('application');
const hostUserData = utils.data('host1');
const collectiveData = utils.data('collective1');
const collective2Data = utils.data('collective2');
const notificationData = { type: constants.COLLECTIVE_TRANSACTION_CREATED };

const {
  User,
  Collective,
  Notification,
  Tier,
  Order
} = models;

describe("notification.model.test.js", () => {

  let hostUser;
  let collective;

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => {
    const promises = [
      User.createUserWithCollective(hostUserData),
      Collective.create(collectiveData),
      Collective.create(collective2Data)
    ];
    return Promise.all(promises).then((results) => {
      hostUser = results[0];
      collective = results[1];
      return collective.addHost(hostUser.collective)
    })
  });

  it(`disables notification for the ${notificationData.type} email`, () =>
    request(app)
      .post(`/groups/${collective.id}/activities/${notificationData.type}/unsubscribe`)
      .set('Authorization', `Bearer ${hostUser.jwt()}`)
      .send({ api_key: application.api_key })
      .expect(200)
      .then(() =>
        Notification.findAndCountAll({where: {
          UserId: hostUser.id,
          CollectiveId: collective.id,
          type: notificationData.type,
          active: true
        }}))
      .tap(res => expect(res.count).to.equal(0)));

  describe('getSubscribers', () => {

    let users;
    beforeEach(() => Promise.map([utils.data('user3'), utils.data('user4')], user => models.User.createUserWithCollective(user)).then(result => users = result))

    it('getSubscribers to the backers mailinglist', async () => {
      await Promise.map(users, user => collective.addUserWithRole(user, 'BACKER'));
      const subscribers = await Notification.getSubscribersUsers(collective.slug, 'backers');
      expect(subscribers.length).to.equal(2);

      await subscribers[0].unsubscribe(collective.id, 'mailinglist.backers')
      const subscribers2 = await Notification.getSubscribers(collective.slug, 'backers');
      expect(subscribers2.length).to.equal(1);
    });

    it('getSubscribers to an event', async () => {
      const eventData = utils.data('event1');
      const tierData = utils.data('tier1');
      const event = await Collective.create({
        ...eventData,
        ParentCollectiveId: collective.id,
      });
      const tier = Tier.create({
        ...tierData,
        CollectiveId: event.id
      });
      await Promise.map(users, (user) => {
        return Order.create({
          CreatedByUserId: user.id,
          FromCollectiveId: user.CollectiveId,
          CollectiveId: collective.id,
          TierId: tier.id
        })
      });
      await Promise.map(users, user => models.Member.create({
        CreatedByUserId: user.id,
        MemberCollectiveId: user.CollectiveId,
        CollectiveId: event.id,
        TierId: tier.id,
        role: roles.FOLLOWER
      }))

      const subscribers = await Notification.getSubscribers(event.slug, event.slug);
      expect(subscribers.length).to.equal(2);

      await users[0].unsubscribe(event.id, `mailinglist.${event.slug}`)
      const subscribers2 = await Notification.getSubscribers(event.slug, event.slug);
      expect(subscribers2.length).to.equal(1);
    })
  });
});

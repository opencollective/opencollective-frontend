import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import * as utils from '../test/utils';
import constants from '../server/constants/activities';
import models from '../server/models';
import roles from '../server/constants/roles';
import _ from 'lodash';
import Promise from 'bluebird';

const application = utils.data('application');
const userData = utils.data('user1');
const user2Data = utils.data('user2');
const collectiveData = utils.data('collective1');
const collective2Data = utils.data('collective2');
const collective3Data = utils.data('collective3');
const notificationData = { type: constants.COLLECTIVE_TRANSACTION_CREATED };

const {
  User,
  Collective,
  Notification,
  Event,
  Tier,
  Response
} = models;

describe("notification.model.test.js", () => {

  let user;
  let user2;
  let collective;
  let collective2;

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => {
    const promises = [User.create(userData), User.create(user2Data), Collective.create(collectiveData), Collective.create(collective2Data)];
    return Promise.all(promises).then((results) => {
      user = results[0];
      user2 = results[1];
      collective = results[2];
      collective2 = results[3];
      return collective.addUserWithRole(user, 'HOST')
    })
  });


  it('subscribes to the notifications for the `collective.transaction.approved` email', () =>
    request(app)
      .post(`/collectives/${collective.id}/activities/collective.transaction.approved/subscribe`)
      .set('Authorization', `Bearer ${user.jwt()}`)
      .send({ api_key: application.api_key })
      .expect(200)
      .then(res => {
        expect(res.body.active).to.be.true;

        return Notification.findAndCountAll({
          where: {
            UserId: user.id,
            CollectiveId: collective.id,
            type: 'collective.transaction.approved'
          }
        });
      })
      .tap(res => expect(res.count).to.equal(1)));

  it(`disables notification for the ${notificationData.type} email`, () =>
    request(app)
      .post(`/collectives/${collective.id}/activities/${notificationData.type}/unsubscribe`)
      .set('Authorization', `Bearer ${user.jwt()}`)
      .send({ api_key: application.api_key })
      .expect(200)
      .then(() =>
        Notification.findAndCountAll({where: {
          UserId: user.id,
          CollectiveId: collective.id,
          type: notificationData.type
        }}))
      .tap(res => expect(res.count).to.equal(0)));

  it('fails to add another notification if one exists', () =>
    request(app)
      .post(`/collectives/${collective.id}/activities/${notificationData.type}/subscribe`)
      .set('Authorization', `Bearer ${user.jwt()}`)
      .send({ api_key: application.api_key })
      .expect(400)
      .then(res => {
        expect(res.body.error.message).to.equal('Already subscribed to this type of activity');
        return Notification.findAndCountAll({
          where: {
            UserId: user.id,
            CollectiveId: collective.id,
            type: notificationData.type
          }
        });
      })
      .tap(res => expect(res.count).to.equal(1)));

  it('fails to add a notification if not a member of the collective', () =>
    request(app)
      .post(`/collectives/${collective2.id}/activities/collective.transaction.approved/subscribe`)
      .set('Authorization', `Bearer ${user.jwt()}`)
      .send({ api_key: application.api_key })
      .expect(403)
      .then(() => Notification.findAndCountAll({where: {
          UserId: user.id,
          CollectiveId: collective2.id,
          type: notificationData.type
        }}))
      .tap(res => expect(res.count).to.equal(0)));

  it('automatically subscribe new members to `collective.transaction.created`, `collective.expense.created` and `collective.monthlyreport` events', () =>
    request(app)
      .post('/collectives')
      .send({
        api_key: application.api_key,
        collective: Object.assign(collective3Data, { users: [{ email: user2.email, role: roles.HOST},{ email: utils.data("user3").email, role: roles.MEMBER}]})
      })
      .expect(200)
      .then(res => Notification.findAndCountAll({where: {
          CollectiveId: res.body.id
        }}))
      .tap(res => {
        const notifications = res.rows;
        const types = _.map(notifications, 'type').sort();
        expect(types).to.deep.equal([ 'collective.expense.created', 'collective.expense.created', 'collective.monthlyreport', 'collective.transaction.created', 'mailinglist.host', 'mailinglist.members' ]);
      })
      .tap(res => expect(res.count).to.equal(6)));

  describe('getSubscribers', () => {

    let users;
    beforeEach(() => User.createMany([utils.data('user3'), utils.data('user4')]).then(result => users = result))

    it('getSubscribers to the backers mailinglist', () => {
      return Promise.map(users, user => collective.addUserWithRole(user, 'BACKER').catch(e => console.error(e)))
      .then(() => Notification.getSubscribers(collective.slug, 'backers').catch(e => console.error(e)))
      .tap(subscribers => {
        expect(subscribers.length).to.equal(2);
      })
      .tap(subscribers => {
        return subscribers[0].unsubscribe(collective.id, 'mailinglist.backers')
      })
      .then(() => Notification.getSubscribers(collective.slug, 'backers'))
      .tap(subscribers => {
        expect(subscribers.length).to.equal(1);
      })
      .catch(e => console.error(e));
    })

    it('getSubscribers to an event', () => {
      const eventData = utils.data('event1');
      const tierData = utils.data('tier1');
      let event;
      return Event.create({
        ...eventData,
        ParentCollectiveId: collective.id
      })
      .then(res => {
        event = res;
        return Tier.create({
          ...tierData,
          CollectiveId: event.id
        })
      })
      .then((tier) => {
        return Promise.map(users, (user) => {
          Response.create({
            UserId: user.id,
            CollectiveId: collective.id,
            TierId: tier.id
          })
        });
      })
      .then(() => Notification.getSubscribers(collective.slug, eventData.slug))
      .then(subscribers => {
        expect(subscribers.length).to.equal(2);
      })
      .then(() => {
        return users[0].unsubscribe(collective.id, `mailinglist.${event.slug}`)
      })
      .then(() => Notification.getSubscribers(collective.slug, eventData.slug))
      .then(subscribers => {
        expect(subscribers.length).to.equal(1);
      })
      .catch(console.error)
    })
  });
});

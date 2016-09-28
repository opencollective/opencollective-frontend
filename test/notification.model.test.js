import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import * as utils from '../test/utils';
import constants from '../server/constants/activities';
import models from '../server/models';
import roles from '../server/constants/roles';

const userData = utils.data('user1');
const user2Data = utils.data('user2');
const groupData = utils.data('group1');
const group2Data = utils.data('group2');
const group3Data = utils.data('group3');
const notificationData = { type: constants.GROUP_TRANSACTION_CREATED };

const {
  User,
  Group,
  Notification
} = models;

describe("notification.model.test.js", () => {

  let application;
  let user;
  let user2;
  let group;
  let group2;

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => {
    const promises = [User.create(userData), User.create(user2Data), Group.create(groupData), Group.create(group2Data)];
    return Promise.all(promises).then((results) => {
      user = results[0];
      user2 = results[1];
      group = results[2];
      group2 = results[3];
      return group.addUserWithRole(user, 'HOST')
    })
    .then(() => {
      notificationData.UserId = user.id;
      notificationData.GroupId = group.id;
      return Notification.create(notificationData);
    });
  });


  it('notifies for the `group.transaction.approved` email', () =>
    request(app)
      .post(`/groups/${group.id}/activities/group.transaction.approved/subscribe`)
      .set('Authorization', `Bearer ${user.jwt()}`)
      .send()
      .expect(200)
      .then(res => {
        expect(res.body.active).to.be.true;

        return Notification.findAndCountAll({
          where: {
            UserId: user.id,
            GroupId: group.id,
            type: 'group.transaction.approved'
          }
        });
      })
      .tap(res => expect(res.count).to.equal(1)));

  it(`disables notification for the ${notificationData.type} email`, () =>
    request(app)
      .post(`/groups/${group.id}/activities/${notificationData.type}/unsubscribe`)
      .set('Authorization', `Bearer ${user.jwt()}`)
      .send()
      .expect(200)
      .then(() =>
        Notification.findAndCountAll({where: {
          UserId: user.id,
          GroupId: group.id,
          type: notificationData.type
        }}))
      .tap(res => expect(res.count).to.equal(0)));

  it('fails to add another notification if one exists', () =>
    request(app)
      .post(`/groups/${group.id}/activities/${notificationData.type}/subscribe`)
      .set('Authorization', `Bearer ${user.jwt()}`)
      .send()
      .expect(400)
      .then(res => {
        expect(res.body.error.message).to.equal('Already subscribed to this type of activity');
        return Notification.findAndCountAll({
          where: {
            UserId: user.id,
            GroupId: group.id,
            type: notificationData.type
          }
        });
      })
      .tap(res => expect(res.count).to.equal(1)));

  it('fails to remove notification if it does not exist', () =>
    request(app)
      .post(`/groups/${group.id}/activities/group.transaction.approved/unsubscribe`)
      .set('Authorization', `Bearer ${user.jwt()}`)
      .send()
      .expect(400)
      .then(res => {
        expect(res.body.error.message).to.equal('You were not subscribed to this type of activity');
        return Notification.findAndCountAll({
          where: {
            UserId: user.id,
            GroupId: group.id,
            type: notificationData.type
          }
        });
      })
      .tap((res) => expect(res.count).to.equal(1)));

  it('fails to add a notification if not a member of the group', () =>
    request(app)
      .post(`/groups/${group2.id}/activities/group.transaction.approved/subscribe`)
      .set('Authorization', `Bearer ${user.jwt()}`)
      .send()
      .expect(403)
      .then(() => Notification.findAndCountAll({where: {
          UserId: user.id,
          GroupId: group2.id,
          type: notificationData.type
        }}))
      .tap(res => expect(res.count).to.equal(0)));

  it('automatically add a notification for a new host to `group.transaction.created` events', () =>
    request(app)
      .post('/groups')
      .send({
        api_key: application.api_key,
        group: Object.assign(group3Data, { users: [{ email: user2.email, role: roles.HOST}]})
      })
      .expect(200)
      .then(res => Notification.findAndCountAll({where: {
          UserId: user2.id,
          GroupId: res.body.id,
          type: constants.GROUP_TRANSACTION_CREATED
        }}))
      .tap(res => expect(res.count).to.equal(0)));
});

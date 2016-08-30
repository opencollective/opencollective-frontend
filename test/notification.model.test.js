/**
 * Dependencies.
 */
var app = require('../server/index');
var expect = require('chai').expect;
var request = require('supertest-as-promised');
var utils = require('../test/utils.js')();
var constants = require('../server/constants/activities');

/**
 * Variable.
 */
var userData = utils.data('user1');
var user2Data = utils.data('user2');
var groupData = utils.data('group1');
var group2Data = utils.data('group2');
var group3Data = utils.data('group3');
var notificationData = { type: constants.GROUP_TRANSACTION_CREATED };

var models = app.get('models');

var User = models.User;
var Group = models.Group;
var Notification = models.Notification;

/**
 * Tests.
 */
describe("notification.model.test.js", () => {

  var application;
  var user;
  var user2;
  var group;
  var group2;

  beforeEach(() => utils.cleanAllDb().tap(a => application = a));

  beforeEach(() => {
    var promises = [User.create(userData), User.create(user2Data), Group.create(groupData), Group.create(group2Data)];
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
      .post('/groups/' + group.id + '/activities/group.transaction.approved/subscribe')
      .set('Authorization', 'Bearer ' + user.jwt(application))
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

  it('disables notification for the ' + notificationData.type + ' email', () =>
    request(app)
      .post('/groups/' + group.id + '/activities/' + notificationData.type + '/unsubscribe')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send()
      .expect(200)
      .then(res =>
        Notification.findAndCountAll({where: {
          UserId: user.id,
          GroupId: group.id,
          type: notificationData.type
        }}))
      .tap(res => expect(res.count).to.equal(0)));

  it('fails to add another notification if one exists', () =>
    request(app)
      .post('/groups/' + group.id + '/activities/' + notificationData.type + '/subscribe')
      .set('Authorization', 'Bearer ' + user.jwt(application))
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
      .post('/groups/' + group.id + '/activities/group.transaction.approved/unsubscribe')
      .set('Authorization', 'Bearer ' + user.jwt(application))
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
      .post('/groups/' + group2.id + '/activities/group.transaction.approved/subscribe')
      .set('Authorization', 'Bearer ' + user.jwt(application))
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
      .set('Authorization', 'Bearer ' + user2.jwt(application))
      .send({group: group3Data, role: 'HOST'})
      .expect(200)
      .then(res => Notification.findAndCountAll({where: {
          UserId: user2.id,
          GroupId: res.body.id,
          type: constants.GROUP_TRANSACTION_CREATED
        }}))
      .tap(res => expect(res.count).to.equal(0)));
});

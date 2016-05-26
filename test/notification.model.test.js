/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var config = require('config');
var expect = require('chai').expect;
var request = require('supertest-as-promised');
var utils = require('../test/utils.js')();
var emailLib = require('../server/lib/email')(app);
var constants = require('../server/constants/activities');

/**
 * Variable.
 */
var userData = utils.data('user1');
var user2Data = utils.data('user2');
var groupData = utils.data('group1');
var group2Data = utils.data('group2');
var group3Data = utils.data('group3');
var transactionsData = utils.data('transactions1').transactions;
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

  beforeEach((done) => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

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

  it('sends a new `group.transaction.created` email notification', (done) => {

    var templateData = {
      transaction: _.extend({}, transactionsData[0]),
      user: user,
      group: group,
      config: config
    };

    templateData.transaction.id = 1;

    if(templateData.transaction.link.match(/\.pdf$/))
      templateData.transaction.preview = {src: 'https://opencollective.com/static/images/mime-pdf.png', width: '100px'};
    else
      templateData.transaction.preview = {src: 'https://res.cloudinary.com/opencollective/image/fetch/w_640/' + templateData.transaction.link, width: '100%'};

    var template = emailLib.templates['group.transaction.created'](templateData);

    var subject = emailLib.getSubject(template);
    var body = emailLib.getBody(template);

    var previousSendMail = app.mailgun.sendMail;
    app.mailgun.sendMail = (options) => {
      expect(options.to).to.equal(user.email);
      expect(options.subject).to.equal(subject);
      expect(options.html).to.equal(body);
      done();
      app.mailgun.sendMail = previousSendMail;
      return options;
    };

    request(app)
      .post('/groups/' + group.id + '/transactions')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send({
        transaction: transactionsData[0]
      })
      .expect(200)
      .end((e, res) => {
        expect(e).to.not.exist;
        expect(res.body).to.have.property('GroupId', group.id);
        expect(res.body).to.have.property('UserId', user.id); // ...

      });
  });

});

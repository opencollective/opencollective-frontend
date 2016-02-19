/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var config = require('config');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();
var emailLib = require('../app/lib/email')(app);
var constants = require('../app/constants/activities');

/**
 * Variable.
 */
var userData = utils.data('user1');
var user2Data = utils.data('user2');
var groupData = utils.data('group1');
var group2Data = utils.data('group2');
var group3Data = utils.data('group3');
var transactionsData = utils.data('transactions1').transactions;
var subscriptionData = { type: constants.GROUP_TRANSANCTION_CREATED };

var models = app.get('models');

var User = models.User;
var Group = models.Group;
var Transaction = models.Transaction;
var Subscription = models.Subscription;

/**
 * Tests.
 */
describe(require('path').basename(__filename), function() {

  var application;
  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  var user;
  var user2;
  var group;
  var group2;

  beforeEach(function(done) {
    var promises = [User.create(userData), User.create(user2Data), Group.create(groupData), Group.create(group2Data)];
    Promise.all(promises).then((results) => {
      user = results[0];
      user2 = results[1];
      group = results[2];
      group2 = results[3];
      return group.addUserWithRole(user, 'HOST')
    })
    .then(() => {
      subscriptionData.UserId = user.id;
      subscriptionData.GroupId = group.id;
      return Subscription.create(subscriptionData).done(done);
    });
  });

  it('subscribes for the `group.transaction.approved` email notification', function(done) {
    request(app)
      .post('/groups/' + group.id + '/activities/group.transaction.approved/subscribe')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send()
      .expect(200)
      .end(function(e, res) {
        expect(e).to.not.exist;
        expect(res.body.active).to.be.true;

        Subscription.findAndCountAll({where: {
          UserId: user.id,
          GroupId: group.id,
          type: 'group.transaction.approved'
        }})
        .then(function(res) {
          expect(res.count).to.equal(1);
        }).done(done);
      })
  });

  it('unsubscribes for the ' + subscriptionData.type + ' email notification', function(done) {
    request(app)
      .post('/groups/' + group.id + '/activities/' + subscriptionData.type + '/unsubscribe')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send()
      .expect(200)
      .end(function(e, res) {
        expect(e).to.not.exist;

        Subscription.findAndCountAll({where: {
          UserId: user.id,
          GroupId: group.id,
          type: subscriptionData.type
        }})
        .then(function(res) {
          expect(res.count).to.equal(0);
        }).done(done);
      })
  });

  it('fails to subscribe if already subscribed', function(done) {
    request(app)
      .post('/groups/' + group.id + '/activities/' + subscriptionData.type + '/subscribe')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send()
      .expect(400)
      .end(function(e, res) {
        expect(e).to.not.exist;
        expect(res.body.error.message).to.equal('Already subscribed to this type of activity');
        Subscription.findAndCountAll({where: {
          UserId: user.id,
          GroupId: group.id,
          type: subscriptionData.type
        }})
        .then(function(res) {
          expect(res.count).to.equal(1);
        }).done(done);
      })
  });

  it('fails to unsubscribe if not subscribed', function(done) {
    request(app)
      .post('/groups/' + group.id + '/activities/group.transaction.approved/unsubscribe')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send()
      .expect(400)
      .end(function(e, res) {
        expect(e).to.not.exist;
        expect(res.body.error.message).to.equal('You were not subscribed to this type of activity');
        Subscription.findAndCountAll({where: {
          UserId: user.id,
          GroupId: group.id,
          type: subscriptionData.type
        }})
        .then(function(res) {
          expect(res.count).to.equal(1);
        }).done(done);
      })
  });

  it('fails to subscribe if not a member of the group', function(done) {
    request(app)
      .post('/groups/' + group2.id + '/activities/group.transaction.approved/subscribe')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send()
      .expect(403)
      .end(function() {
        Subscription.findAndCountAll({where: {
          UserId: user.id,
          GroupId: group2.id,
          type: subscriptionData.type
        }})
        .then(function(res) {
          expect(res.count).to.equal(0);
        }).done(done);
      })
  });

  it('automatically subscribe a new host to `group.transaction.created` events', function(done) {
    request(app)
      .post('/groups')
      .set('Authorization', 'Bearer ' + user2.jwt(application))
      .send({group: group3Data, role: 'HOST'})
      .expect(200)
      .end(function(e, res) {
        Subscription.findAndCountAll({where: {
          UserId: user2.id,
          GroupId: res.body.id,
          type: constants.GROUP_TRANSACTION_CREATED
        }})
        .then(function(res) {
          expect(res.count).to.equal(0);
        }).done(done);
      })
  });

  it('sends a new `group.transaction.created` email notification', function(done) {

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
    app.mailgun.sendMail = function(options) {
      expect(options.to).to.equal(user.email);
      expect(options.subject).to.equal(subject);
      expect(options.html).to.equal(body);
      done();
      app.mailgun.sendMail = previousSendMail;
      return options;
    }

    request(app)
      .post('/groups/' + group.id + '/transactions')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send({
        transaction: transactionsData[0]
      })
      .expect(200)
      .end(function(e, res) {
        expect(e).to.not.exist;
        expect(res.body).to.have.property('GroupId', group.id);
        expect(res.body).to.have.property('UserId', user.id); // ...

      });
  });

});

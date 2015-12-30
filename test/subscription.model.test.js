/**
 * Dependencies.
 */
var app = require('../index');
var config = require('config');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();
var emailLib = require('../app/lib/email')(app);

/**
 * Variable.
 */
var userData = utils.data('user1');
var groupData = utils.data('group1');
var transactionsData = utils.data('transactions1').transactions;
var subscriptionData = { type: 'group.transaction.created' };

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
  var group;
  beforeEach(function(done) {
    User.create(userData).then(function(u) {
      user = u;
      return Group.create(groupData);
    }).then(function(g) {
      group = g;
      return group.addMember(user, {role: 'admin'})
    }).then(function() {
      subscriptionData.UserId = user.id;
      subscriptionData.GroupId = group.id;
      return Subscription.create(subscriptionData);
    }).done(done);
  });

  it('subscribes for the group.transaction.approved email notification', function(done) {
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
          expect(res.count).to.equal(0);
        }).done(done);
      })
  });

  it('unsubscribes for the group.transaction.approved email notification', function(done) {
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

  it('sends a new group.transaction.created email notification', function(done) {

    var templateData = {
      transaction: transactionsData[0],
      user: user,
      group: group,
      config: config
    };

    templateData.transaction.id = 1;
    var template = emailLib.templates['group.transaction.created'](templateData);

    var subject = emailLib.getSubject(template);
    var body = emailLib.getBody(template);

    app.mailgun.sendMail = function(options) {
      expect(options.to).to.equal(user.email);
      expect(options.subject).to.equal(subject);
      expect(options.html).to.equal(body);
      done();
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

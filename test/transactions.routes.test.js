/**
 * Dependencies.
 */
var expect    = require('chai').expect
  , request   = require('supertest')
  , _         = require('lodash')
  , app       = require('../index')
  , utils     = require('../test/utils.js')()
  , config    = require('config')
  ;

/**
 * Variables.
 */
var userData = utils.data('user1');
var groupData = utils.data('group1');
var models = app.set('models');
var transactionsData = utils.data('transactions1').transactions;

/**
 * Tests.
 */
describe.only('transactions.routes.test.js', function() {

  var group, user, user2, application, application2, application3;

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  // Create user.
  beforeEach(function(done) {
    models.User.create(utils.data('user1')).done(function(e, u) {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  // Create user2.
  beforeEach(function(done) {
    models.User.create(utils.data('user2')).done(function(e, u) {
      expect(e).to.not.exist;
      user2 = u;
      done();
    });
  });

  // Create the group.
  beforeEach(function(done) {
    models.Group.create(groupData).done(function(e, g) {
      expect(e).to.not.exist;
      group = g;
      done();
    });
  });

  // Add user to the group.
  beforeEach(function(done) {
    group
      .addMember(user, {role: 'admin'})
      .done(done);
  });

  // Create an application which has only access to `group`
  beforeEach(function(done) {
    models.Application.create(utils.data('application2')).done(function(e, a) {
      expect(e).to.not.exist;
      application2 = a;
      application2.addGroup(group).done(done);
    });
  });

  // Create an independent application.
  beforeEach(function(done) {
    models.Application.create(utils.data('application3')).done(function(e, a) {
      expect(e).to.not.exist;
      application3 = a;
      done();
    });
  });

  /**
   * Get.
   */
  describe('#create', function() {

    it('fails creating a transaction if no authenticated', function(done) {
      request(app)
        .post('/groups/' + group.id + '/transactions')
        .send({
          transaction: transactionsData[0]
        })
        .expect(401)
        .end(done);
    });

    it('fails creating a transaction if no transaction passed', function(done) {
      request(app)
        .post('/groups/' + group.id + '/transactions')
        .send({
          api_key: application2.api_key
        })
        .expect(400)
        .end(done);
    });

    it('fails creating a transaction if user has no access to the group', function(done) {
      request(app)
        .post('/groups/' + group.id + '/transactions')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .send({
          transaction: transactionsData[0]
        })
        .expect(403)
        .end(done);
    });

    it('fails creating a transaction if application has no access to the group', function(done) {
      request(app)
        .post('/groups/' + group.id + '/transactions')
        .send({
          api_key: application3.api_key,
          transaction: transactionsData[0]
        })
        .expect(403)
        .end(done);
    });

    it('successfully create a transaction', function(done) {
      request(app)
        .post('/groups/' + group.id + '/transactions')
        .send({
          api_key: application2.api_key,
          transaction: transactionsData[0]
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('currency', 'USD');
          expect(res.body).to.have.property('beneficiary', transactionsData[0].beneficiary);
          expect(res.body).to.have.property('GroupId', group.id);
          expect(res.body).to.have.property('UserId', null); // ...

          models.Activity.findAndCountAll({}).then(function(res) {
            expect(res.count).to.equal(1);
            done();
          });

        });
    });

    it('successfully create a transaction with a user', function(done) {
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

          models.Activity.findAndCountAll({}).then(function(res) {
            expect(res.count).to.equal(1);
            done();
          });

        });
    });

  });

});

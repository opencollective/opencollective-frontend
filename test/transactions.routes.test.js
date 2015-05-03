/**
 * Dependencies.
 */
var expect    = require('chai').expect
  , request   = require('supertest')
  , _         = require('lodash')
  , async     = require('async')
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
describe('transactions.routes.test.js', function() {

  var group, group2, user, user2, application, application2, application3;

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

  // Create the group2.
  beforeEach(function(done) {
    models.Group.create(utils.data('group2')).done(function(e, g) {
      expect(e).to.not.exist;
      group2 = g;
      done();
    });
  });

  // Add user to the group.
  beforeEach(function(done) {
    group
      .addMember(user, {role: 'admin'})
      .done(done);
  });

  // Add user to the group2.
  beforeEach(function(done) {
    group2
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

    it('successfully create a transaction with an application', function(done) {
      request(app)
        .post('/groups/' + group.id + '/transactions')
        .send({
          api_key: application2.api_key,
          transaction: transactionsData[0]
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          var t = res.body;
          expect(t).to.have.property('id');
          expect(t).to.have.property('currency', 'USD');
          expect(t).to.have.property('beneficiary', transactionsData[0].beneficiary);
          expect(t).to.have.property('GroupId', group.id);
          expect(t).to.have.property('UserId', null); // ...

          models.Activity.findAndCountAll({}).then(function(res) {
            expect(res.rows[0]).to.have.property('TransactionId', t.id);
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

  /**
   * Delete.
   */
  describe.only('#delete', function() {

    var transactions = [];

    // Create transactions.
    beforeEach(function(done) {
      async.each(transactionsData, function(transaction, cb) {
        request(app)
          .post('/groups/' + group.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transaction
          })
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            transactions.push(res.body);
            cb();
          });
      }, done);
    });

    it('fails deleting a non-existing transaction', function(done) {
      request(app)
        .delete('/groups/' + group.id + '/transactions/' + 987123)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails deleting a transaction which does not belong to the group', function(done) {
      request(app)
        .delete('/groups/' + group2.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails deleting a transaction if user has no access to the group', function(done) {
      request(app)
      .delete('/groups/' + group.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully delete a transaction', function(done) {
      request(app)
        .delete('/groups/' + group.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          async.parallel([
            function(cb) {
              models.Transaction.find(transactions[0].id).then(function(t) {
                expect(t).to.not.exist;
                cb();
              });
            },
            function(cb) {
              models.Activity.findAndCountAll({where: {TransactionId: transactions[0].id} }).then(function(res) {
                expect(res.count).to.equal(0);
                cb();
              });
            }
          ], done);

        });
    });

    it('successfully delete a transaction with an application', function(done) {
      request(app)
        .delete('/groups/' + group.id + '/transactions/' + transactions[0].id)
        .send({
          api_key: application2.api_key
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          done();
        });
    });


  });

});

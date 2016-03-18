/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var async = require('async');
var config = require('config');
var expect = require('chai').expect;
var request = require('supertest');
var chance = require('chance').Chance();
var utils = require('../test/utils.js')();
var roles = require('../app/constants/roles');
var sinon = require('sinon');

/**
 * Variables.
 */
var userData = utils.data('user1');
var publicGroupData = utils.data('group1');
var privateGroupData = utils.data('group2');
var transactionsData = utils.data('transactions1').transactions;
var models = app.set('models');
var stripeMock = require('./mocks/stripe')
var stripeEmail = stripeMock.accounts.create.email;

/**
 * Tests.
 */
describe.only('groups.routes.test.js', function() {

  var application;
  var user;
  var sandbox = sinon.sandbox.create();

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  beforeEach(function(done) {
    models.User.create(userData).done(function(e, u) {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  // Stripe stub.
  var stub;
  beforeEach(function() {
    var stub = sinon.stub(app.stripe.accounts, 'create');
    stub.yields(null, stripeMock.accounts.create);
  });
  afterEach(function() {
    app.stripe.accounts.create.restore();
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  /**
   * Create.
   */
  describe('#create', function() {

    it('fails creating a group if not authenticated', function(done) {
      request(app)
        .post('/groups')
        .send({
          group: privateGroupData
        })
        .expect(401)
        .end(function(e, res) {
          expect(e).to.not.exist;
          done();
        });
    });

    it('fails creating a group without data', function(done) {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(400)
        .end(function(e, res) {
          expect(e).to.not.exist;
          done();
        });
    });

    it('fails creating a group without name', function(done) {
      var group = _.omit(privateGroupData, 'name');

      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: group
        })
        .expect(400)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.have.property('message', 'notNull Violation: name cannot be null');
          expect(res.body.error).to.have.property('type', 'validation_failed');
          expect(res.body.error).to.have.property('fields');
          expect(res.body.error.fields).to.contain('name');
          done();
        });
    });

    it('fails if @ symbol in twitterHandle', function(done) {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: _.extend({}, privateGroupData, {twitterHandle: '@asood123'})
        })
        .expect(400, {
          error: {
            code: 400,
            type: 'validation_failed',
            message: 'Validation error: twitterHandle must be without @ symbol',
            fields: ['twitterHandle']
          }
        })
        .end(done);
    });

    it('fails if the tier has missing data', function(done) {
      var g = _.extend({}, privateGroupData);
      g.tiers = [{ // interval missing
        name: 'Silver',
        description: 'Silver',
        range: [100, 200]
      }];

      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: g
        })
        .expect(400, {
          error: {
            code: 400,
            type: 'validation_failed',
            message: 'Validation error: \"title\" is required',
            fields: ['tiers']
          }
        })
        .end(done);
    });


    it('successfully create a group without assigning a member', function(done) {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: privateGroupData
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('description');
          expect(res.body).to.have.property('budget', privateGroupData.budget);
          expect(res.body).to.have.property('currency', privateGroupData.currency);
          expect(res.body).to.have.property('longDescription');
          expect(res.body).to.have.property('logo');
          expect(res.body).to.have.property('video');
          expect(res.body).to.have.property('image');
          expect(res.body).to.have.property('expensePolicy');
          expect(res.body).to.have.property('membershipType');
          expect(res.body).to.have.property('membershipfee');
          expect(res.body).to.have.property('createdAt');
          expect(res.body).to.have.property('updatedAt');
          expect(res.body).to.have.property('twitterHandle');
          expect(res.body).to.have.property('website');
          expect(res.body).to.have.property('isPublic', false);

          user.getGroups().then(function(groups) {
            expect(groups).to.have.length(0);
            done();
          });
        });

    });

    it('successfully create a group assigning the caller as host', function(done) {
      var role = roles.HOST;

      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: privateGroupData,
          role: role
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('description');
          expect(res.body).to.have.property('longDescription');
          expect(res.body).to.have.property('logo');
          expect(res.body).to.have.property('video');
          expect(res.body).to.have.property('image');
          expect(res.body).to.have.property('expensePolicy');
          expect(res.body).to.have.property('membershipType');
          expect(res.body).to.have.property('membershipfee');
          expect(res.body).to.have.property('createdAt');
          expect(res.body).to.have.property('updatedAt');
          expect(res.body).to.have.property('twitterHandle');
          expect(res.body).to.have.property('website');

          user.getGroups().then(function(groups) {
            expect(groups).to.have.length(1);
            done();
          });
        });
    });

  });

  /**
   * Get.
   */
  describe('#get', function() {

    var group;
    var publicGroup;
    var user2;
    var application2;
    var application3;
    var stripeEmail;

    var stubStripe = function() {
      var stub = sinon.stub(app.stripe.accounts, 'create');
      var mock = stripeMock.accounts.create;
      mock.email = chance.email();
      stripeEmail = mock.email;
      stub.yields(null, mock);
    };

    beforeEach(function() {
      app.stripe.accounts.create.restore();
      stubStripe();
    });

    // Create the group with user.
    beforeEach(function(done) {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: privateGroupData,
          role: roles.HOST
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          models.Group
            .find(parseInt(res.body.id))
            .then(function(g) {
              privateGroup = g;
              done();
            })
            .catch(done);
        });
    });

    beforeEach(function() {
      app.stripe.accounts.create.restore();
      stubStripe();
    });

    // Create the public group with user.
    beforeEach(function(done) {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: publicGroupData,
          role: roles.HOST
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          models.Group
            .find(parseInt(res.body.id))
            .then(function(g) {
              publicGroup = g;
              done();
            })
            .catch(done);
        });
    });

    beforeEach(function(done) {
      models.StripeAccount.create({
        stripePublishableKey: stripeMock.accounts.create.keys.publishable
      })
      .tap(function(account) {
        return user.setStripeAccount(account);
      })
      .tap(function(account) {
        return user.setStripeAccount(account);
      })
      .then(function() {
        done();
      })
      .catch(done);
    });

    // Create another user.
    beforeEach(function(done) {
      models.User.create(utils.data('user2')).done(function(e, u) {
        expect(e).to.not.exist;
        user2 = u;
        done();
      });
    });

    // Create an application which has only access to `privateGroup`
    beforeEach(function(done) {
      models.Application.create(utils.data('application2')).done(function(e, a) {
        expect(e).to.not.exist;
        application2 = a;
        application2.addGroup(privateGroup).done(done);
      });
    });

    // Create an application which doesn't have access to any group
    beforeEach(function(done) {
      models.Application.create(utils.data('application3')).done(function(e, a) {
        expect(e).to.not.exist;
        application3 = a;
        done();
      });
    });

    it('fails getting a group if not authenticated', function(done) {
      request(app)
        .get('/groups/' + privateGroup.id)
        .expect(401)
        .end(done);
    });

    it('fails getting a group if the user authenticated has no access', function(done) {
      request(app)
        .get('/groups/' + privateGroup.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails getting an undefined group', function(done) {
      request(app)
        .get('/groups/undefined')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(404)
        .end(done);
    });

    it('successfully get a group if authenticated as a user', function(done) {
      request(app)
        .get('/groups/' + privateGroup.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', privateGroup.id);
          expect(res.body).to.have.property('name', privateGroup.name);
          expect(res.body).to.have.property('description', privateGroup.description);
          expect(res.body).to.have.property('stripeAccount');
          expect(res.body.stripeAccount).to.have.property('stripePublishableKey', stripeMock.accounts.create.keys.publishable);
          done();
        });
    });

    it('successfully get a group if it is public', function(done) {
      request(app)
        .get('/groups/' + publicGroup.id)
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', publicGroup.id);
          expect(res.body).to.have.property('name', publicGroup.name);
          expect(res.body).to.have.property('isPublic', publicGroup.isPublic);
          expect(res.body).to.have.property('stripeAccount');
          expect(res.body.stripeAccount).to.have.property('stripePublishableKey', stripeMock.accounts.create.keys.publishable);
          done();
        });
    });

    it('successfully get a group by its slug (case insensitive)', function(done) {
      request(app)
        .get('/groups/' + publicGroup.slug.toUpperCase())
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', publicGroup.id);
          expect(res.body).to.have.property('name', publicGroup.name);
          expect(res.body).to.have.property('isPublic', publicGroup.isPublic);
          expect(res.body).to.have.property('stripeAccount');
          expect(res.body.stripeAccount).to.have.property('stripePublishableKey', stripeMock.accounts.create.keys.publishable);
          done();
        });
    });

    it('fails getting a group if the application authenticated has no access', function(done) {
      request(app)
        .get('/groups/' + privateGroup.id)
        .send({
          api_key: application3.api_key
        })
        .expect(403)
        .end(done);
    });

    it('successfully get a group if authenticated as a group', function(done) {
      request(app)
        .get('/groups/' + privateGroup.id)
        .send({
          api_key: application2.api_key
        })
        .expect(200)
        .end(done);
    });

    describe('Transactions/Activities/Budget', function() {

      var group2;
      var transactions = [];
      var totTransactions = 0;
      var totDonations = 0;

      // Create group2.
      beforeEach(function(done) {
        models.Group.create(utils.data('group2')).done(function(e, g) {
          expect(e).to.not.exist;
          group2 = g;
          group2
            .addUserWithRole(user, roles.HOST)
            .done(done);
        });
      });


      // Create transactions for publicGroup.
      beforeEach(function(done) {
        async.each(transactionsData, function(transaction, cb) {
          if (transaction.amount < 0)
            totTransactions += transaction.amount;
          else
            totDonations += transaction.amount;

          request(app)
            .post('/groups/' + publicGroup.id + '/transactions')
            .set('Authorization', 'Bearer ' + user.jwt(application))
            .send({
              transaction: _.extend({}, transaction, { approved: true })
            })
            .expect(200)
            .end(function(e, res) {
              expect(e).to.not.exist;
              transactions.push(res.body);
              cb();
            });
        }, done);
      });

      // Create a transaction for group2.
      beforeEach(function(done) {
        request(app)
          .post('/groups/' + group2.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transactionsData[0]
          })
          .expect(200)
          .end(done);
      });

      it('successfully get a group with remaining budget', function(done) {
        request(app)
          .get('/groups/' + publicGroup.id)
          .send({
            api_key: application2.api_key
          })
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            var g = res.body;
            expect(g).to.have.property('balance', totDonations + totTransactions);
            expect(g).to.not.have.property('activities');
            done();
          });
      });

      it('successfully get a group with activities', function(done) {
        request(app)
          .get('/groups/' + publicGroup.id)
          .send({
            api_key: application2.api_key,
            activities: true
          })
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            var group = res.body;
            expect(group).to.have.property('activities');
            expect(group.activities).to.have.length(transactionsData.length + 1 + 1); // + group.created + group.user.added

            // Check data content.
            group.activities.forEach(function(a) {
              if (a.GroupId)
                expect(a.data).to.have.property('group');
              if (a.UserId)
                expect(a.data).to.have.property('user');
              if (a.TransactionId)
                expect(a.data).to.have.property('transaction');
            });

            done();
          });
      });

      it('successfully get a group\'s users if it is public', function(done) {
        request(app)
          .get('/groups/' + publicGroup.id + '/users')
          .send({
            api_key: application2.api_key
          })
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            var userData = res.body[0];
            expect(userData.name).to.equal(user.public.name);
            expect(userData.role).to.equal(roles.HOST);
            expect(userData.tier).to.equal(publicGroup.tiers[1].name);
            done();
          });
      });

    });

    describe('Leaderboard', () => {

      it('fails if the app is not authorized', done => {
        request(app)
          .get('/leaderboard')
          .expect(400, {
            error: {
              code: 400,
              type: 'missing_required',
              message: 'Missing required fields',
              fields: { api_key: 'Required field api_key missing' }
            }
          })
          .end(done);
      });

      it('returns the leaderboard', done => {
        request(app)
          .get('/leaderboard')
          .send({
            api_key: application2.api_key,
          })
          .expect(200)
          .end(done);
      });

    });

  });

  /**
   * Update.
   */
  describe('#update', function() {

    var group;
    var user2;
    var user3;
    var application2;
    var groupNew = {
      name: 'newname',
      description: 'newdesc',
      budget: 11111.99,
      membershipType: 'donation',
      membershipfee: 11,
      longDescription: 'long description',
      logo: 'http://opencollective.com/assets/icon.svg',
      video: 'http://opencollective.com/assets/icon.svg',
      image: 'http://opencollective.com/assets/icon.svg',
      expensePolicy: 'expense policy',
      isPublic: true,
      otherprop: 'value'
    };

    // Create the group with user.
    beforeEach(function(done) {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: publicGroupData,
          role: roles.HOST
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          models.Group
            .find(parseInt(res.body.id))
            .then(function(g) {
              group = g;
              done();
            })
            .catch(done);
        });
    });

    // Create another user.
    beforeEach(function(done) {
      models.User.create(utils.data('user2')).done(function(e, u) {
        expect(e).to.not.exist;
        user2 = u;
        done();
      });
    });

    // Create another user that is a backer.
    beforeEach(function(done) {
      models.User.create(utils.data('user3')).done(function(e, u) {
        expect(e).to.not.exist;
        user3 = u;
        group
          .addUserWithRole(user3, roles.BACKER)
          .done(done);
      });
    });

    // Create another user that is a member.
    beforeEach(function(done) {
      models.User.create(utils.data('user4')).done(function(e, u) {
        expect(e).to.not.exist;
        user4 = u;
        group
          .addUserWithRole(user4, roles.MEMBER)
          .done(done);
      });
    });

    // Create an application which has only access to `group`
    beforeEach(function(done) {
      models.Application.create(utils.data('application2')).done(function(e, a) {
        expect(e).to.not.exist;
        application2 = a;
        application2.addGroup(group).done(done);
      });
    });

    it('fails updating a group if not authenticated', function(done) {
      request(app)
        .put('/groups/' + group.id)
        .send({
          group: groupNew
        })
        .expect(401)
        .end(done);
    });

    it('fails updating a group if the user authenticated has no access', function(done) {
      request(app)
        .put('/groups/' + group.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .send({
          group: groupNew
        })
        .expect(403)
        .end(done);
    });

    it('fails updating a group if the user authenticated is a viewer', function(done) {
      request(app)
        .put('/groups/' + group.id)
        .set('Authorization', 'Bearer ' + user3.jwt(application))
        .send({
          group: groupNew
        })
        .expect(403)
        .end(done);
    });

    it('fails updating a group if no data passed', function(done) {
      request(app)
        .put('/groups/' + group.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(400)
        .end(done);
    });

    it('successfully updates a group if authenticated as a MEMBER', function(done) {
      request(app)
        .put('/groups/' + group.id)
        .set('Authorization', 'Bearer ' + user4.jwt(application))
        .send({
          group: groupNew
        })
        .expect(200)
        .end(done);
    });

    it('successfully udpates a group if authenticated as a user', function(done) {
      request(app)
        .put('/groups/' + group.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: groupNew
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', group.id);
          expect(res.body).to.have.property('name', groupNew.name);
          expect(res.body).to.have.property('description', groupNew.description);
          expect(res.body).to.have.property('budget', groupNew.budget);
          expect(res.body).to.have.property('membershipType', groupNew.membershipType);
          expect(res.body).to.have.property('membershipfee', groupNew.membershipfee);
          expect(res.body).to.have.property('longDescription', groupNew.longDescription);
          expect(res.body).to.have.property('logo', groupNew.logo);
          expect(res.body).to.have.property('video', groupNew.video);
          expect(res.body).to.have.property('image', groupNew.image);
          expect(res.body).to.have.property('expensePolicy', groupNew.expensePolicy);
          expect(res.body).to.have.property('isPublic', groupNew.isPublic);
          expect(res.body).to.not.have.property('otherprop');
          expect(new Date(res.body.createdAt).getTime()).to.equal(new Date(group.createdAt).getTime());
          expect(new Date(res.body.updatedAt).getTime()).to.not.equal(new Date(group.updatedAt).getTime());
          done();
        });
    });

    it('successfully updates a group if authenticated as a group', function(done) {
      request(app)
        .put('/groups/' + group.id)
        .send({
          api_key: application2.api_key,
          group: groupNew
        })
        .expect(200)
        .end(done);
    });

    it('successfully create a group with HOST and assign same person to be a MEMBER and a BACKER', function(done) {
      /* TODO: this works but we'll need to do a lot refactoring.
       * Need to find a way to call this with one line: like group.addUser()
       */
      models.UserGroup.create({
        UserId: user3.id,
        GroupId: group.id,
        role: roles.MEMBER
      })
      .done(function(e) {
        expect(e).to.not.exist;
        models.UserGroup
            .findAll()
            .then(function(rows) {
              expect(rows.length).to.equal(4);
              done();
            })
            .catch(done);
      });
    });

  });

});

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
var roles = require('../server/constants/roles');
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
describe('groups.routes.test.js', () => {

  var application;
  var user;
  var sandbox = sinon.sandbox.create();

  beforeEach((done) => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  beforeEach((done) => {
    models.User.create(userData).done((e, u) => {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  // Stripe stub.
  var stub;
  beforeEach(() => {
    var stub = sinon.stub(app.stripe.accounts, 'create');
    stub.yields(null, stripeMock.accounts.create);
  });
  afterEach(() => {
    app.stripe.accounts.create.restore();
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  /**
   * Create.
   */
  describe('#create', () => {

    it('fails creating a group if not authenticated', (done) => {
      request(app)
        .post('/groups')
        .send({
          group: privateGroupData
        })
        .expect(401)
        .end((e, res) => {
          expect(e).to.not.exist;
          done();
        });
    });

    it('fails creating a group without data', (done) => {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(400)
        .end((e, res) => {
          expect(e).to.not.exist;
          done();
        });
    });

    it('fails creating a group without name', (done) => {
      var group = _.omit(privateGroupData, 'name');

      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: group
        })
        .expect(400)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.have.property('message', 'notNull Violation: name cannot be null');
          expect(res.body.error).to.have.property('type', 'validation_failed');
          expect(res.body.error).to.have.property('fields');
          expect(res.body.error.fields).to.contain('name');
          done();
        });
    });

    it('fails if @ symbol in twitterHandle', (done) => {
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

    it('fails if the tier has missing data', (done) => {
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


    it('successfully create a group without assigning a member', (done) => {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: privateGroupData
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('mission');
          expect(res.body).to.have.property('description');
          expect(res.body).to.have.property('longDescription');
          expect(res.body).to.have.property('budget', privateGroupData.budget);
          expect(res.body).to.have.property('burnrate');
          expect(res.body).to.have.property('currency', privateGroupData.currency);
          expect(res.body).to.have.property('logo');
          expect(res.body).to.have.property('video');
          expect(res.body).to.have.property('image');
          expect(res.body).to.have.property('backgroundImage');
          expect(res.body).to.have.property('expensePolicy');
          expect(res.body).to.have.property('createdAt');
          expect(res.body).to.have.property('updatedAt');
          expect(res.body).to.have.property('twitterHandle');
          expect(res.body).to.have.property('website');
          expect(res.body).to.have.property('isPublic', false);

          user.getGroups().then((groups) => {
            expect(groups).to.have.length(0);
            done();
          });
        });

    });

    it('successfully create a group assigning the caller as host', (done) => {
      var role = roles.HOST;

      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: privateGroupData,
          role: role
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('mission');
          expect(res.body).to.have.property('description');
          expect(res.body).to.have.property('longDescription');
          expect(res.body).to.have.property('logo');
          expect(res.body).to.have.property('video');
          expect(res.body).to.have.property('image');
          expect(res.body).to.have.property('backgroundImage');
          expect(res.body).to.have.property('expensePolicy');
          expect(res.body).to.have.property('createdAt');
          expect(res.body).to.have.property('updatedAt');
          expect(res.body).to.have.property('twitterHandle');
          expect(res.body).to.have.property('website');

          user.getGroups().then((groups) => {
            expect(groups).to.have.length(1);
            done();
          });
        });
    });

  });

  /**
   * Get.
   */
  describe('#get', () => {

    var group;
    var publicGroup;
    var user2;
    var application2;
    var application3;
    var stripeEmail;

    var stubStripe = () => {
      var stub = sinon.stub(app.stripe.accounts, 'create');
      var mock = stripeMock.accounts.create;
      mock.email = chance.email();
      stripeEmail = mock.email;
      stub.yields(null, mock);
    };

    beforeEach(() => {
      app.stripe.accounts.create.restore();
      stubStripe();
    });

    // Create the group with user.
    beforeEach((done) => {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: privateGroupData,
          role: roles.HOST
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          models.Group
            .find(parseInt(res.body.id))
            .then((g) => {
              privateGroup = g;
              done();
            })
            .catch(done);
        });
    });

    beforeEach(() => {
      app.stripe.accounts.create.restore();
      stubStripe();
    });

    // Create the public group with user.
    beforeEach((done) => {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: publicGroupData,
          role: roles.HOST
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          models.Group
            .find(parseInt(res.body.id))
            .then((g) => {
              publicGroup = g;
              done();
            })
            .catch(done);
        });
    });

    beforeEach((done) => {
      models.StripeAccount.create({
        stripePublishableKey: stripeMock.accounts.create.keys.publishable
      })
      .tap((account) => {
        return user.setStripeAccount(account);
      })
      .tap((account) => {
        return user.setStripeAccount(account);
      })
      .then(() => {
        done();
      })
      .catch(done);
    });

    // Create another user.
    beforeEach((done) => {
      models.User.create(utils.data('user2')).done((e, u) => {
        expect(e).to.not.exist;
        user2 = u;
        done();
      });
    });

    // Create an application which has only access to `privateGroup`
    beforeEach((done) => {
      models.Application.create(utils.data('application2')).done((e, a) => {
        expect(e).to.not.exist;
        application2 = a;
        application2.addGroup(privateGroup).done(done);
      });
    });

    // Create an application which doesn't have access to any group
    beforeEach((done) => {
      models.Application.create(utils.data('application3')).done((e, a) => {
        expect(e).to.not.exist;
        application3 = a;
        done();
      });
    });

    it('fails getting a group if not authenticated', (done) => {
      request(app)
        .get('/groups/' + privateGroup.id)
        .expect(401)
        .end(done);
    });

    it('fails getting a group if the user authenticated has no access', (done) => {
      request(app)
        .get('/groups/' + privateGroup.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails getting an undefined group', (done) => {
      request(app)
        .get('/groups/undefined')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(404)
        .end(done);
    });

    it('successfully get a group if authenticated as a user', (done) => {
      request(app)
        .get('/groups/' + privateGroup.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', privateGroup.id);
          expect(res.body).to.have.property('name', privateGroup.name);
          expect(res.body).to.have.property('description', privateGroup.description);
          expect(res.body).to.have.property('stripeAccount');
          expect(res.body.stripeAccount).to.have.property('stripePublishableKey', stripeMock.accounts.create.keys.publishable);
          done();
        });
    });

    it('successfully get a group if it is public', (done) => {
      request(app)
        .get('/groups/' + publicGroup.id)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', publicGroup.id);
          expect(res.body).to.have.property('name', publicGroup.name);
          expect(res.body).to.have.property('isPublic', publicGroup.isPublic);
          expect(res.body).to.have.property('stripeAccount');
          expect(res.body.stripeAccount).to.have.property('stripePublishableKey', stripeMock.accounts.create.keys.publishable);
          done();
        });
    });

    it('successfully get a group by its slug (case insensitive)', (done) => {
      request(app)
        .get('/groups/' + publicGroup.slug.toUpperCase())
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', publicGroup.id);
          expect(res.body).to.have.property('name', publicGroup.name);
          expect(res.body).to.have.property('isPublic', publicGroup.isPublic);
          expect(res.body).to.have.property('stripeAccount');
          expect(res.body.stripeAccount).to.have.property('stripePublishableKey', stripeMock.accounts.create.keys.publishable);
          done();
        });
    });

    it('fails getting a group if the application authenticated has no access', (done) => {
      request(app)
        .get('/groups/' + privateGroup.id)
        .send({
          api_key: application3.api_key
        })
        .expect(403)
        .end(done);
    });

    it('successfully get a group if authenticated as a group', (done) => {
      request(app)
        .get('/groups/' + privateGroup.id)
        .send({
          api_key: application2.api_key
        })
        .expect(200)
        .end(done);
    });

    describe('Transactions/Activities/Budget', () => {

      var group2;
      var transactions = [];
      var totTransactions = 0;
      var totDonations = 0;

      // Create group2.
      beforeEach((done) => {
        models.Group.create(utils.data('group2')).done((e, g) => {
          expect(e).to.not.exist;
          group2 = g;
          group2
            .addUserWithRole(user, roles.HOST)
            .done(done);
        });
      });


      // Create transactions for publicGroup.
      beforeEach((done) => {
        async.each(transactionsData, (transaction, cb) => {
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
            .end((e, res) => {
              expect(e).to.not.exist;
              transactions.push(res.body);
              cb();
            });
        }, done);
      });

      // Create a transaction for group2.
      beforeEach((done) => {
        request(app)
          .post('/groups/' + group2.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transactionsData[0]
          })
          .expect(200)
          .end(done);
      });

      it('successfully get a group with remaining budget', (done) => {
        request(app)
          .get('/groups/' + publicGroup.id)
          .send({
            api_key: application2.api_key
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            var g = res.body;
            expect(g).to.have.property('balance', totDonations + totTransactions);
            expect(g).to.not.have.property('activities');
            done();
          });
      });

      it('successfully get a group with activities', (done) => {
        request(app)
          .get('/groups/' + publicGroup.id)
          .send({
            api_key: application2.api_key,
            activities: true
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            var group = res.body;
            expect(group).to.have.property('activities');
            expect(group.activities).to.have.length(transactionsData.length + 1 + 1); // + group.created + group.user.added

            // Check data content.
            group.activities.forEach((a) => {
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

      it('successfully get a group\'s users if it is public', (done) => {
        request(app)
          .get('/groups/' + publicGroup.id + '/users')
          .send({
            api_key: application2.api_key
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            var userData = res.body[0];
            expect(userData.name).to.equal(user.public.name);
            expect(userData.role).to.equal(roles.HOST);
            expect(userData.tier).to.equal(null);
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
  describe('#update', () => {

    var group;
    var user2;
    var user3;
    var application2;
    var groupNew = {
      name: 'new name',
      mission: 'new mission',
      description: 'new desc',
      longDescription: 'long description',
      budget: 1000000,
      burnrate: 10000,
      logo: 'http://opencollective.com/assets/logo.svg',
      video: 'http://opencollective.com/assets/video.mp4',
      image: 'http://opencollective.com/assets/image.jpg',
      backgroundImage: 'http://opencollective.com/assets/backgroundImage.png',
      expensePolicy: 'expense policy',
      isPublic: true,
      otherprop: 'value'
    };

    // Create the group with user.
    beforeEach((done) => {
      request(app)
        .post('/groups')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: publicGroupData,
          role: roles.HOST
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          models.Group
            .find(parseInt(res.body.id))
            .then((g) => {
              group = g;
              done();
            })
            .catch(done);
        });
    });

    // Create another user.
    beforeEach((done) => {
      models.User.create(utils.data('user2')).done((e, u) => {
        expect(e).to.not.exist;
        user2 = u;
        done();
      });
    });

    // Create another user that is a backer.
    beforeEach((done) => {
      models.User.create(utils.data('user3')).done((e, u) => {
        expect(e).to.not.exist;
        user3 = u;
        group
          .addUserWithRole(user3, roles.BACKER)
          .done(done);
      });
    });

    // Create another user that is a member.
    beforeEach((done) => {
      models.User.create(utils.data('user4')).done((e, u) => {
        expect(e).to.not.exist;
        user4 = u;
        group
          .addUserWithRole(user4, roles.MEMBER)
          .done(done);
      });
    });

    // Create an application which has only access to `group`
    beforeEach((done) => {
      models.Application.create(utils.data('application2')).done((e, a) => {
        expect(e).to.not.exist;
        application2 = a;
        application2.addGroup(group).done(done);
      });
    });

    it('fails updating a group if not authenticated', (done) => {
      request(app)
        .put('/groups/' + group.id)
        .send({
          group: groupNew
        })
        .expect(401)
        .end(done);
    });

    it('fails updating a group if the user authenticated has no access', (done) => {
      request(app)
        .put('/groups/' + group.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .send({
          group: groupNew
        })
        .expect(403)
        .end(done);
    });

    it('fails updating a group if the user authenticated is a viewer', (done) => {
      request(app)
        .put('/groups/' + group.id)
        .set('Authorization', 'Bearer ' + user3.jwt(application))
        .send({
          group: groupNew
        })
        .expect(403)
        .end(done);
    });

    it('fails updating a group if no data passed', (done) => {
      request(app)
        .put('/groups/' + group.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(400)
        .end(done);
    });

    it('successfully updates a group if authenticated as a MEMBER', (done) => {
      request(app)
        .put('/groups/' + group.id)
        .set('Authorization', 'Bearer ' + user4.jwt(application))
        .send({
          group: groupNew
        })
        .expect(200)
        .end(done);
    });

    it('successfully udpates a group if authenticated as a user', (done) => {
      request(app)
        .put('/groups/' + group.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          group: groupNew
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', group.id);
          expect(res.body).to.have.property('name', groupNew.name);
          expect(res.body).to.have.property('mission', groupNew.mission);
          expect(res.body).to.have.property('description', groupNew.description);
          expect(res.body).to.have.property('longDescription', groupNew.longDescription);
          expect(res.body).to.have.property('budget', groupNew.budget);
          expect(res.body).to.have.property('burnrate', groupNew.burnrate);
          expect(res.body).to.have.property('logo', groupNew.logo);
          expect(res.body).to.have.property('video', groupNew.video);
          expect(res.body).to.have.property('image', groupNew.image);
          expect(res.body).to.have.property('backgroundImage', groupNew.backgroundImage);
          expect(res.body).to.have.property('expensePolicy', groupNew.expensePolicy);
          expect(res.body).to.have.property('isPublic', groupNew.isPublic);
          expect(res.body).to.not.have.property('otherprop');
          expect(new Date(res.body.createdAt).getTime()).to.equal(new Date(group.createdAt).getTime());
          expect(new Date(res.body.updatedAt).getTime()).to.not.equal(new Date(group.updatedAt).getTime());
          done();
        });
    });

    it('successfully updates a group if authenticated as an application', (done) => {
      request(app)
        .put('/groups/' + group.id)
        .send({
          api_key: application2.api_key,
          group: groupNew
        })
        .expect(200)
        .end(done);
    });

    it('successfully create a group with HOST and assign same person to be a MEMBER and a BACKER', (done) => {
      /* TODO: this works but we'll need to do a lot refactoring.
       * Need to find a way to call this with one line: like group.addUser()
       */
      models.UserGroup.create({
        UserId: user3.id,
        GroupId: group.id,
        role: roles.MEMBER
      })
      .done((e) => {
        expect(e).to.not.exist;
        models.UserGroup
            .findAll()
            .then((rows) => {
              expect(rows.length).to.equal(4);
              done();
            })
            .catch(done);
      });
    });

  });

});

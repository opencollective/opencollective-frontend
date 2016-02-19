/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var async = require('async');
var config = require('config');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();
var generatePlanId = require('../app/lib/utils.js').planId;
var sinon = require('sinon');
var nock = require('nock');
var chance = require('chance').Chance();
var roles = require('../app/constants/roles');

/**
 * Variables.
 */
var STRIPE_URL = 'https://api.stripe.com:443';
var CHARGE = 10.99;
var CURRENCY = 'EUR';
var STRIPE_TOKEN = 'superStripeToken';
var EMAIL = 'paypal@email.com';
var userData = utils.data('user3');
var groupData = utils.data('group2');
var transactionsData = utils.data('transactions1').transactions;
var models = app.set('models');
var stripeMock = require('./mocks/stripe');

/**
 * Tests.
 */
describe('payments.routes.test.js', () => {

  var application;
  var application2;
  var user;
  var group;
  var group2;
  var nocks = {};
  var stripeEmail;

  var stubStripe = () => {
    var mock = stripeMock.accounts.create;
    mock.email = chance.email();
    stripeEmail = mock.email;

    var stub = sinon.stub(app.stripe.accounts, 'create');
    stub.yields(null, mock);
  };

  var mailgunStub = sinon.stub(app.mailgun, 'sendMail');

  beforeEach((done) => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

  // Create a user.
  beforeEach((done) => {
    models.User.create(userData).done((e, u) => {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  // Nock for customers.create.
  beforeEach(() => {
    nocks['customers.create'] = nock(STRIPE_URL)
      .post('/v1/customers')
      .reply(200, stripeMock.customers.create);
  });



  beforeEach(() => {
    stubStripe();
  });

  // Create a group.
  beforeEach((done) => {
    request(app)
      .post('/groups')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send({
        group: groupData,
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

  beforeEach(() => {
    app.stripe.accounts.create.restore();
    stubStripe();
  });

  // Create a second group.
  beforeEach((done) => {
    request(app)
      .post('/groups')
      .set('Authorization', 'Bearer ' + user.jwt(application))
      .send({
        group: utils.data('group2'),
        role: roles.HOST
      })
      .expect(200)
      .end((e, res) => {
        expect(e).to.not.exist;
        models.Group
          .find(parseInt(res.body.id))
          .then((g) => {
            group2 = g;
            done();
          })
          .catch(done);
      });
  });

  beforeEach(() => {
    app.stripe.accounts.create.restore();
  });

  beforeEach((done) => {
    models.StripeAccount.create({
      accessToken: 'abc'
    })
    .then((account) => user.setStripeAccount(account))
    .then(() => done())
    .catch(done);
  });

  // Create an application which has only access to `group`
  beforeEach((done) => {
    models.Application.create(utils.data('application2')).done((e, a) => {
      expect(e).to.not.exist;
      application2 = a;
      application2.addGroup(group2).done(done);
    });
  });

  // Nock for charges.create.
  beforeEach(() => {
    var params = [
      'amount=' + CHARGE * 100,
      'currency=' + CURRENCY,
      'customer=' + stripeMock.customers.create.id,
      'description=' + encodeURIComponent('One time donation to ' + group.name),
      encodeURIComponent('metadata[groupId]') + '=' + group.id,
      encodeURIComponent('metadata[groupName]') + '=' + encodeURIComponent(groupData.name),
      encodeURIComponent('metadata[customerEmail]') + '=' + encodeURIComponent(user.email),
      encodeURIComponent('metadata[cardId]') + '=1'
    ].join('&');

    nocks['charges.create'] = nock(STRIPE_URL)
      .post('/v1/charges', params)
      .reply(200, stripeMock.charges.create);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  /**
   * Post a payment.
   */
  describe('#postPayments', () => {

    // TODO: unskip when sync issue on tests is fixed
    describe.skip('Payment success by a group\'s user', () => {

      beforeEach((done) => {
        request(app)
          .post('/groups/' + group.id + '/payments')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            payment: {
              stripeToken: STRIPE_TOKEN,
              amount: CHARGE,
              currency: CURRENCY,
              email: user.email
            }
          })
          .expect(200)
          .end(done);
      });

      it('successfully creates a Stripe customer', () => {
        expect(nocks['customers.create'].isDone()).to.be.true;
      });

      it('successfully creates a card with the UserId and the GroupId', (done) => {
        models.Card
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('GroupId', group.id);
            expect(res.rows[0]).to.have.property('UserId', user.id);
            expect(res.rows[0]).to.have.property('token', STRIPE_TOKEN);
            expect(res.rows[0]).to.have.property('service', 'stripe');
            expect(res.rows[0]).to.have.property('serviceId', stripeMock.customers.create.id);
            done();
          })
          .catch(done);
      });

      it('successfully makes a Stripe charge', () => {
        expect(nocks['charges.create'].isDone()).to.be.true;
      });

      it('successfully creates a transaction in the database', (done) => {
        models.Transaction
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('GroupId', group.id);
            expect(res.rows[0]).to.have.property('UserId', user.id);
            expect(res.rows[0]).to.have.property('CardId', 1);
            expect(res.rows[0]).to.have.property('currency', CURRENCY);
            expect(res.rows[0]).to.have.property('type', 'payment');
            expect(res.rows[0]).to.have.property('amount', CHARGE);
            expect(res.rows[0]).to.have.property('paidby', user.id.toString());
            expect(res.rows[0]).to.have.property('approved', true);
            expect(res.rows[0].tags[0]).to.be.equal('Donation');
            expect(res.rows[0]).to.have.property('description',
              'Donation to ' + group.name);
            done();
          })
          .catch(done);
      });

    });

    // TODO: unskip when sync issue on tests is fixed
    describe.skip('Next payment success with a same stripe token', () => {

      var CHARGE2 = 1.99;

      beforeEach((done) => {
        request(app)
          .post('/groups/' + group.id + '/payments')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            payment: {
              stripeToken: STRIPE_TOKEN,
              amount: CHARGE,
              currency: CURRENCY,
              email: user.email
            }
          })
          .expect(200)
          .end(done);
      });

      // New nock for customers.create.
      beforeEach(() => {
        nocks['customers.create2'] = nock(STRIPE_URL)
          .post('/v1/customers')
          .reply(200, stripeMock.customers.create);
      });

      // Nock for charges.create.
      beforeEach(() => {
        var params = [
          'amount=' + CHARGE2 * 100,
          'currency=' + CURRENCY,
          'customer=' + stripeMock.customers.create.id,
          'description=' + encodeURIComponent('One time donation to ' + group.name),
          encodeURIComponent('metadata[groupId]') + '=' + group.id,
          encodeURIComponent('metadata[groupName]') + '=' + encodeURIComponent(group.name),
          encodeURIComponent('metadata[customerEmail]') + '=' + encodeURIComponent(user.email),
          encodeURIComponent('metadata[cardId]') + '=1'
        ].join('&');

        nocks['charges.create2'] = nock(STRIPE_URL)
          .post('/v1/charges', params)
          .reply(200, stripeMock.charges.create);
      });

      beforeEach((done) => {
        request(app)
          .post('/groups/' + group.id + '/payments')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            payment: {
              stripeToken: STRIPE_TOKEN,
              amount: CHARGE2,
              currency: CURRENCY,
              email: user.email
            }
          })
          .expect(200)
          .end(done);
      });

      it('does not re-create a Stripe Customer with a same token', () => {
        expect(nocks['customers.create2'].isDone()).to.be.false;
      });

      it('does not re-create a card', (done) => {
        models.Card
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            done();
          })
          .catch(done);
      });

      it('successfully makes a new Stripe charge', () => {
        expect(nocks['charges.create2'].isDone()).to.be.true;
      });

      it('successfully creates a new transaction', (done) => {
        models.Transaction
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(2);
            expect(res.rows[1]).to.have.property('amount', CHARGE2);
            done();
          })
          .catch(done);
      });

    });

    describe('Payment success by a user that is not part of the group yet', () => {

      // Nock for charges.create.
      beforeEach(() => {
        var params = [
          'amount=' + CHARGE * 100,
          'currency=' + CURRENCY,
          'customer=' + stripeMock.customers.create.id,
          'description=' + encodeURIComponent('One time donation to ' + group2.name),
          encodeURIComponent('metadata[groupId]') + '=' + group2.id,
          encodeURIComponent('metadata[groupName]') + '=' + encodeURIComponent(group2.name),
          encodeURIComponent('metadata[customerEmail]') + '=' + encodeURIComponent(EMAIL),
          encodeURIComponent('metadata[cardId]') + '=1'
        ].join('&');

        nocks['charges.create'] = nock(STRIPE_URL)
          .post('/v1/charges', params)
          .reply(200, stripeMock.charges.create);
      });

      beforeEach((done) => {
        request(app)
          .post('/groups/' + group2.id + '/payments')
          .set('Authorization', 'Bearer ' + user.jwt(application2))
          .send({
            payment: {
              stripeToken: STRIPE_TOKEN,
              amount: CHARGE,
              currency: CURRENCY,
              email: EMAIL
            }
          })
          .expect(200)
          .end(done);
      });

      it('successfully adds the user to the group as a backer', (done) => {
        group2
          .getUsers()
          .then((users) => {
            expect(users).to.have.length(2);
            var backer = _.find(users, {email: EMAIL});
            expect(backer.UserGroup.role).to.equal(roles.BACKER);
            done();
          })
          .catch(done);
      });

    });

    // TODO: unskip when sync issue on tests is fixed
    describe.skip('Payment success by a user who is a MEMBER of the group and should become BACKER', () => {

      // Add a user as a MEMBER
      beforeEach((done) => {
        models.User.create(utils.data('user4')).done(function(e, u) {
          expect(e).to.not.exist;
          user4 = u;
          group2
            .addUserWithRole(user4, roles.MEMBER)
            .done(done);
        });
      });

      // Nock for charges.create.
      beforeEach(() => {
        var params = [
          'amount=' + CHARGE * 100,
          'currency=' + CURRENCY,
          'customer=' + stripeMock.customers.create.id,
          'description=' + encodeURIComponent('One time donation to ' + group2.name),
          encodeURIComponent('metadata[groupId]') + '=' + group2.id,
          encodeURIComponent('metadata[groupName]') + '=' + encodeURIComponent(group2.name),
          encodeURIComponent('metadata[customerEmail]') + '=' + encodeURIComponent(user4.email),
          encodeURIComponent('metadata[cardId]') + '=1'
        ].join('&');

        nocks['charges.create'] = nock(STRIPE_URL)
          .post('/v1/charges', params)
          .reply(200, stripeMock.charges.create);
      });

      beforeEach((done) => {
        request(app)
          .post('/groups/' + group2.id + '/payments')
          .set('Authorization', 'Bearer ' + user.jwt(application2))
          .send({
            payment: {
              stripeToken: STRIPE_TOKEN,
              amount: CHARGE,
              currency: CURRENCY,
              email: user4.email
            }
          })
          .expect(200)
          .end(done);
      });

      it('successfully adds the user to the group as a backer', (done) => {
        group2
          .getUsers()
          .then((users) => {
            expect(users).to.have.length(3);
            var backer = _.find(users, {email: user4.email});
            expect(backer.UserGroup.role).to.equal(roles.BACKER);
            done();
          })
          .catch(done);
      });

    });

    // TODO: unskip when sync issue on tests is fixed
    describe.skip('Payment success by anonymous user', () => {

      var data = {
        stripeToken: STRIPE_TOKEN,
        amount: CHARGE,
        currency: CURRENCY,
        description: 'super description',
        beneficiary: '@beneficiary',
        paidby: '@paidby',
        tags: ['tag1', 'tag2'],
        status: 'super status',
        link: 'www.opencollective.com',
        comment: 'super comment',
        email: userData.email
      };

      // Nock for charges.create.
      beforeEach(() => {
        var params = [
          'amount=' + CHARGE * 100,
          'currency=' + CURRENCY,
          'customer=' + stripeMock.customers.create.id,
          'description=' + encodeURIComponent('One time donation to ' + group2.name),
          encodeURIComponent('metadata[groupId]') + '=' + group2.id,
          encodeURIComponent('metadata[groupName]') + '=' + encodeURIComponent(group2.name),
          encodeURIComponent('metadata[customerEmail]') + '=' + encodeURIComponent(userData.email),
          encodeURIComponent('metadata[cardId]') + '=1'
        ].join('&');

        nocks['charges.create'] = nock(STRIPE_URL)
          .post('/v1/charges', params)
          .reply(200, stripeMock.charges.create);
      });

      beforeEach('successfully makes a anonymous payment', (done) => {
        request(app)
          .post('/groups/' + group2.id + '/payments')
          .send({
            api_key: application2.api_key,
            payment: data
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            done();
          });
      });

      it('successfully creates a Stripe customer', () => {
        expect(nocks['customers.create'].isDone()).to.be.true;
      });

      it('successfully creates a card with the GroupId', (done) => {
        models.Card
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('GroupId', group2.id);
            expect(res.rows[0]).to.have.property('UserId', null);
            done();
          })
          .catch(done);
      });

      it('successfully makes a Stripe charge', () => {
        expect(nocks['charges.create'].isDone()).to.be.true;
      });

      it('successfully creates a user', (done) => {

        models.User.findAndCountAll({
          where: {
              email: userData.email
            }
        })
        .then((res) => {
          expect(res.count).to.equal(1);
          expect(res.rows[0]).to.have.property('email', userData.email);
          done();
        })
        .catch(done)
      })

      it('successfully creates a transaction in the database', (done) => {
        models.Transaction
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('GroupId', group2.id);
            expect(res.rows[0]).to.have.property('UserId', user.id);
            expect(res.rows[0]).to.have.property('CardId', 1);
            expect(res.rows[0]).to.have.property('currency', CURRENCY);
            expect(res.rows[0]).to.have.property('tags');
            expect(res.rows[0]).to.have.property('paymentMethod', null);
            expect(res.rows[0]).to.have.property('isWaitingFirstInvoice', false);
            expect(res.rows[0].tags[0]).to.equal(data.tags[0]);
            expect(res.rows[0].tags[1]).to.equal(data.tags[1]);
            ['amount', 'description', 'beneficiary', 'paidby', 'status', 'link', 'comment'].forEach((prop) => {
              expect(res.rows[0]).to.have.property(prop, data[prop]);
            });
            done();
          })
          .catch(done);
      });

      it('successfully send a thank you email', (done) => {
        expect(mailgunStub.lastCall.args[0].to).to.equal(userData.email);
        done();
      });

    });

    describe('Recurring payment success', () => {

      var data = {
        stripeToken: STRIPE_TOKEN,
        amount: 10,
        currency: CURRENCY,
        interval: 'month',
        description: 'super description',
        beneficiary: '@beneficiary',
        paidby: '@paidby',
        tags: ['tag1', 'tag2'],
        status: 'super status',
        link: 'www.opencollective.com',
        comment: 'super comment',
        email: EMAIL
      };

      var customerId = stripeMock.customers.create.id;
      var planId = generatePlanId({
        currency: CURRENCY,
        interval: data.interval,
        amount: data.amount * 100
      });

      var plan = _.extend({}, stripeMock.plans.create, {
        amount: data.amount,
        interval: data.interval,
        name: planId,
        id: planId
      });

      beforeEach(() => {
        nocks['plans.create'] = nock(STRIPE_URL)
          .post('/v1/plans')
          .reply(200, plan);

        nocks['subscriptions.create'] = nock(STRIPE_URL)
          .post('/v1/customers/' + customerId + '/subscriptions',
            'plan=' + planId + '&application_fee_percent=5')
          .reply(200, stripeMock.subscriptions.create);
      });

      describe('plan does not exist', () => {
        beforeEach((done) => {

          nocks['plans.retrieve'] = nock(STRIPE_URL)
            .get('/v1/plans/' + planId)
            .reply(200, {
              error: stripeMock.plans.create_not_found
            });

          request(app)
            .post('/groups/' + group2.id + '/payments')
            .send({
              api_key: application2.api_key,
              payment: data
            })
            .expect(200)
            .end((e, res) => {
              expect(e).to.not.exist;
              done();
            });
        });

        it('creates a plan if it doesn\'t exist', () => {
          expect(nocks['plans.retrieve'].isDone()).to.be.true;
          expect(nocks['plans.create'].isDone()).to.be.true;
        });

      });

      describe('plan exists', () => {

        beforeEach((done) => {

          nocks['plans.retrieve'] = nock(STRIPE_URL)
            .get('/v1/plans/' + planId)
            .reply(200, plan);

          request(app)
            .post('/groups/' + group2.id + '/payments')
            .send({
              api_key: application2.api_key,
              payment: data
            })
            .expect(200)
            .end((e, res) => {
              expect(e).to.not.exist;
              done();
            });
        });

        it('uses the existing plan', () => {
          expect(nocks['plans.create'].isDone()).to.be.false;
          expect(nocks['plans.retrieve'].isDone()).to.be.true;
        });

        it('creates a subscription', () => {
          expect(nocks['subscriptions.create'].isDone()).to.be.true;
        });

        it('creates a transaction', (done) => {
          models.Transaction
            .findAndCountAll({})
            .then((res) => {
              expect(res.count).to.equal(1);
              expect(res.rows[0]).to.have.property('GroupId', group2.id);
              expect(res.rows[0]).to.have
                .property('stripeSubscriptionId', stripeMock.subscriptions.create.id);
              expect(res.rows[0]).to.have.property('isWaitingFirstInvoice', true);
              expect(res.rows[0]).to.have.property('UserId', 2);
              expect(res.rows[0]).to.have.property('CardId', 1);
              expect(res.rows[0]).to.have.property('currency', CURRENCY);
              expect(res.rows[0]).to.have.property('tags');
              expect(res.rows[0]).to.have.property('interval', plan.interval);
              expect(res.rows[0].tags[0]).to.equal(data.tags[0]);
              expect(res.rows[0].tags[1]).to.equal(data.tags[1]);
              ['amount', 'description', 'beneficiary', 'paidby', 'status', 'link', 'comment'].forEach((prop) => {
                expect(res.rows[0]).to.have.property(prop, data[prop]);
              });
              done();
            })
            .catch(done);
        });

        it('fails if the interval is not month or year', (done) => {

          request(app)
            .post('/groups/' + group2.id + '/payments')
            .send({
              api_key: application2.api_key,
              payment: _.extend({}, data, {interval: 'something'})
            })
            .expect(400, {
              error: {
                code: 400,
                type: 'bad_request',
                message: 'Interval should be month or year.'
              }
            })
            .end(done);
        });

      });

    });

    describe('Payment errors', () => {

      beforeEach(() => {
        nock.cleanAll();
        nocks['customers.create'] = nock(STRIPE_URL)
          .post('/v1/customers')
          .replyWithError(stripeMock.customers.createError);
      });

      it('fails paying because of a card declined', (done) => {
        request(app)
          .post('/groups/' + group.id + '/payments')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            payment: {
              stripeToken: STRIPE_TOKEN,
              amount: CHARGE,
              currency: CURRENCY
            }
          })
          .expect(400)
          .end(done);
      });

    });

  });

});

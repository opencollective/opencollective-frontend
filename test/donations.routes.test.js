/**
 * Dependencies.
 */
const _ = require('lodash');
const app = require('../index');
const expect = require('chai').expect;
const request = require('supertest');
const sinon = require('sinon');
const nock = require('nock');
const chance = require('chance').Chance();

const utils = require('../test/utils.js')();
const generatePlanId = require('../app/lib/utils.js').planId;
const roles = require('../app/constants/roles');
const constants = require('../app/constants/transactions');

/**
 * Variables.
 */
const STRIPE_URL = 'https://api.stripe.com:443';
const CHARGE = 10.99;
const CURRENCY = 'EUR';
const STRIPE_TOKEN = 'superStripeToken';
const EMAIL = 'paypal@email.com';
const userData = utils.data('user3');
const groupData = utils.data('group2');
const models = app.set('models');
const stripeMock = require('./mocks/stripe');

/**
 * Tests.
 */
describe('donations.routes.test.js', () => {

  var application;
  var application2;
  var user;
  var group;
  var group2;
  var nocks = {};
  var stripeEmail;
  var sandbox = sinon.sandbox.create();

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

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
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

  beforeEach((done) => {
    models.ConnectedAccount.create({
      provider: 'paypal',
      // Sandbox api keys
      clientId: 'AZaQpRstiyI1ymEOGUXXuLUzjwm3jJzt0qrI__txWlVM29f0pTIVFk5wM9hLY98w5pKCE7Rik9QYvdYA',
      secret: 'EILQQAMVCuCTyNDDOWTGtS7xBQmfzdMcgSVZJrCaPzRbpGjQFdd8sylTGE-8dutpcV0gJkGnfDE0PmD8'
    })
    .then((account) => account.setUser(user))
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
      encodeURIComponent('metadata[paymentMethodId]') + '=1'
    ].join('&');

    nocks['charges.create'] = nock(STRIPE_URL)
      .post('/v1/charges', params)
      .reply(200, stripeMock.charges.create);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  /**
   * Post a payment.
   */
  describe('#postPayments', () => {

    describe('Payment success by a group\'s user', () => {

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

      it('successfully creates a paymentMethod with the UserId', (done) => {
        models.PaymentMethod
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('UserId', user.id);
            expect(res.rows[0]).to.have.property('token', STRIPE_TOKEN);
            expect(res.rows[0]).to.have.property('service', 'stripe');
            expect(res.rows[0]).to.have.property('customerId', stripeMock.customers.create.id);
            done();
          })
          .catch(done);
      });

      it('successfully makes a Stripe charge', () => {
        expect(nocks['charges.create'].isDone()).to.be.true;
      });

      it('successfully creates a donation in the database', (done) => {
        models.Donation
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('UserId', user.id);
            expect(res.rows[0]).to.have.property('GroupId', group.id);
            expect(res.rows[0]).to.have.property('currency', CURRENCY);
            expect(res.rows[0]).to.have.property('amount', CHARGE*100);
            expect(res.rows[0]).to.have.property('title',
              'Donation to ' + group.name);
            done();
          })
          .catch(done);
      });

      it('successfully creates a transaction in the database', (done) => {
        models.Transaction
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('UserId', user.id);
            expect(res.rows[0]).to.have.property('PaymentMethodId', 1);
            expect(res.rows[0]).to.have.property('currency', CURRENCY);
            expect(res.rows[0]).to.have.property('type', constants.type.DONATION);
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

    describe('Next payment success with a same stripe token', () => {

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
          encodeURIComponent('metadata[paymentMethodId]') + '=1'
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

      it('does not re-create a paymentMethod', (done) => {
        models.PaymentMethod
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

      it('successfully creates a donation in the database', (done) => {
        models.Donation
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(2);
            expect(res.rows[1]).to.have.property('amount', CHARGE2*100);
            done();
          })
          .catch(done);
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
          encodeURIComponent('metadata[paymentMethodId]') + '=1'
        ].join('&');

        nocks['charges.create'] = nock(STRIPE_URL)
          .post('/v1/charges', params)
          .reply(200, stripeMock.charges.create);
      });

      beforeEach((done) => {
        request(app)
          .post('/groups/' + group2.id + '/payments')
          .send({
            api_key: application.api_key,
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

    describe('Payment success by a user who is a MEMBER of the group and should become BACKER', () => {

      // Add a user as a MEMBER
      beforeEach((done) => {
        models.User.create(utils.data('user4')).done((e, u) => {
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
          encodeURIComponent('metadata[paymentMethodId]') + '=1'
        ].join('&');

        nocks['charges.create'] = nock(STRIPE_URL)
          .post('/v1/charges', params)
          .reply(200, stripeMock.charges.create);
      });

      beforeEach((done) => {
        request(app)
          .post('/groups/' + group2.id + '/payments')
          .set('Authorization', 'Bearer ' + user4.jwt(application2))
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

    describe('Payment success by anonymous user', () => {

      var data = {
        stripeToken: STRIPE_TOKEN,
        amount: CHARGE,
        currency: CURRENCY,
        description: 'super description',
        vendor: '@vendor',
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
          encodeURIComponent('metadata[paymentMethodId]') + '=1'
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
          .end((e) => {
            expect(e).to.not.exist;
            done();
          });
      });

      it('successfully creates a Stripe customer', () => {
        expect(nocks['customers.create'].isDone()).to.be.true;
      });

      it('successfully creates a paymentMethod', (done) => {
        models.PaymentMethod
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('UserId', 1);
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

      it('successfully creates a donation in the database', (done) => {
        models.Donation
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('UserId', user.id);
            expect(res.rows[0]).to.have.property('GroupId', group2.id);
            expect(res.rows[0]).to.have.property('currency', CURRENCY);
            expect(res.rows[0]).to.have.property('amount', CHARGE*100);
            expect(res.rows[0]).to.have.property('title',
              'Donation to ' + group.name);
            done();
          })
          .catch(done);
      });

      it('successfully creates a transaction in the database', (done) => {
        models.Transaction
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('GroupId', group2.id);
            expect(res.rows[0]).to.have.property('UserId', user.id);
            expect(res.rows[0]).to.have.property('PaymentMethodId', 1);
            expect(res.rows[0]).to.have.property('currency', CURRENCY);
            expect(res.rows[0]).to.have.property('tags');
            expect(res.rows[0]).to.have.property('payoutMethod', null);
            expect(res.rows[0]).to.have.property('amount', data.amount);
            expect(res.rows[0]).to.have.property('paidby', String(user.id));
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
        vendor: '@vendor',
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
        var params = [
          `plan=${planId}`,
          'application_fee_percent=5',
          encodeURIComponent('metadata[groupId]') + '=' + group2.id,
          encodeURIComponent('metadata[groupName]') + '=' + encodeURIComponent(group2.name),
          encodeURIComponent('metadata[paymentMethodId]') + '=1'
        ].join('&');

      nocks['subscriptions.create'] = nock(STRIPE_URL)
        .post(`/v1/customers/${customerId}/subscriptions`, params)
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

      it('successfully creates a donation in the database', (done) => {
        models.Donation
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('UserId', 2);
            expect(res.rows[0]).to.have.property('GroupId', group2.id);
            expect(res.rows[0]).to.have.property('currency', CURRENCY);
            expect(res.rows[0]).to.have.property('amount', data.amount*100);
            expect(res.rows[0]).to.have.property('SubscriptionId');
            expect(res.rows[0]).to.have.property('title',
              `Donation to ${group.name}`);
            done();
          })
          .catch(done);
      });

        it('does not create a transaction', (done) => {
          models.Transaction
            .findAndCountAll({})
            .then((res) => {
              expect(res.count).to.equal(0);
              done();
            })
            .catch(done);
        });


        it('creates a Subscription model', (done) => {
          models.Subscription
            .findAndCountAll({})
            .then((res) => {
              const subscription = res.rows[0];

              expect(res.count).to.equal(1);
              expect(subscription).to.have.property('amount', data.amount);
              expect(subscription).to.have.property('interval', plan.interval);
              expect(subscription).to.have.property('stripeSubscriptionId', stripeMock.subscriptions.create.id);
              expect(subscription).to.have.property('data');
              expect(subscription).to.have.property('isActive', false);
              expect(subscription).to.have.property('currency', CURRENCY);
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

    describe('Paypal recurring donation', () => {
      describe('success', () => {
        var links;
        const token = 'EC-123';

        beforeEach((done) => {
          request(app)
            .post(`/groups/${group.id}/payments/paypal`)
            .send({
              payment: {
                amount: 10,
                currency: 'USD',
                interval: 'month'
              },
              api_key: application2.api_key
            })
            .end((err, res) => {
              expect(err).to.not.exist;
              links = res.body.links;
              done();
            });
        });

        it('creates a transaction and returns the links', (done) => {
          expect(links[0]).to.have.property('method', 'REDIRECT');
          expect(links[0]).to.have.property('rel', 'approval_url');
          expect(links[0]).to.have.property('href');

          expect(links[1]).to.have.property('method', 'POST');
          expect(links[1]).to.have.property('rel', 'execute');
          expect(links[1]).to.have.property('href');

          models.Transaction.findAndCountAll({
            include: [{
              model: models.Subscription
            }],
            paranoid: false
          })
          .then((res) => {
            expect(res.count).to.equal(1);
            const transaction = res.rows[0];
            const subscription = transaction.Subscription;

            expect(transaction).to.have.property('GroupId', group.id);
            expect(transaction).to.have.property('currency', 'USD');
            expect(transaction).to.have.property('tags');
            expect(transaction).to.have.property('interval', 'month');
            expect(transaction).to.have.property('amount', 10);

            expect(subscription).to.have.property('data');
            expect(subscription).to.have.property('interval', 'month');
            expect(subscription).to.have.property('amount', 10);

            done();
          })
          .catch(done);
        });

        it('executes the billing agreement', (done) => {
          const email = 'testemail@test.com';

          // Taken from https://github.com/paypal/PayPal-node-SDK/blob/71dcd3a5e2e288e2990b75a54673fb67c1d6855d/test/mocks/generate_token.js
          nock('https://api.sandbox.paypal.com:443')
            .post('/v1/oauth2/token', "grant_type=client_credentials")
            .reply(200, "{\"scope\":\"https://uri.paypal.com/services/invoicing openid https://api.paypal.com/v1/developer/.* https://api.paypal.com/v1/payments/.* https://api.paypal.com/v1/vault/credit-paymentMethod/.* https://api.paypal.com/v1/vault/credit-paymentMethod\",\"access_token\":\"IUIkXAOcYVNHe5zcQajcNGwVWfoUcesp7-YURMLohPI\",\"token_type\":\"Bearer\",\"app_id\":\"APP-2EJ531395M785864S\",\"expires_in\":28800}");

          const executeRequest = nock('https://api.sandbox.paypal.com:443')
            .post(`/v1/payments/billing-agreements/${token}/agreement-execute`)
            .reply(200, {
              id: 'I-123',
              payer: {
                payment_method: 'paypal',
                status: 'verified',
                payer_info: {
                  email
                }
              }
            });

          request(app)
            .get(`/groups/${group.id}/transactions/1/callback?token=${token}`) // hardcode transaction id
            .end((err, res) => {
              expect(err).to.not.exist;
              expect(executeRequest.isDone()).to.be.true;
              const text = res.text;

              models.Transaction.findAndCountAll({
                include: [
                  { model: models.Subscription },
                  { model: models.User }
                ]
              })
              .then((res) => {
                expect(res.count).to.equal(1);
                const transaction = res.rows[0];
                const subscription = transaction.Subscription;
                const user = transaction.User;

                expect(subscription).to.have.property('data');
                expect(subscription.data).to.have.property('billingAgreementId');
                expect(subscription.data).to.have.property('plan');

                expect(user).to.have.property('email', email);

                expect(text).to.contain(`userid=${user.id}`)
                expect(text).to.contain('has_full_account=false')
                expect(text).to.contain('status=payment_success')

                return group.getUsers();
              })
              .then((users) => {
                const backer = _.find(users, {email: email});
                expect(backer.UserGroup.role).to.equal(roles.BACKER);
                done();
              })
              .catch(done);
            });
        });
      });
    });

    describe('Paypal single donation', () => {
      describe('success', () => {
        var links;
        const token = 'EC-123';
        const paymentId = 'PAY-123';
        const PayerID = 'ABC123';

        beforeEach((done) => {
          request(app)
            .post(`/groups/${group.id}/payments/paypal`)
            .send({
              payment: {
                amount: 10,
                currency: 'USD'
              },
              api_key: application2.api_key
            })
            .end((err, res) => {
              expect(err).to.not.exist;
              links = res.body.links;
              done();
            });
        });

        it('creates a transaction and returns the links', (done) => {
          const redirect = _.find(links, { method: 'REDIRECT' });

          expect(redirect).to.have.property('method', 'REDIRECT');
          expect(redirect).to.have.property('rel', 'approval_url');
          expect(redirect).to.have.property('href');

          models.Transaction.findAndCountAll({ paranoid: false })
          .then((res) => {
            expect(res.count).to.equal(1);
            const transaction = res.rows[0];

            expect(transaction).to.have.property('GroupId', group.id);
            expect(transaction).to.have.property('currency', 'USD');
            expect(transaction).to.have.property('tags');
            expect(transaction).to.have.property('interval', null);
            expect(transaction).to.have.property('SubscriptionId', null);
            expect(transaction).to.have.property('amount', 10);

            done();
          })
          .catch(done);
        });

        it('executes the billing agreement', (done) => {
          const email = 'testemail@test.com';

          // Taken from https://github.com/paypal/PayPal-node-SDK/blob/71dcd3a5e2e288e2990b75a54673fb67c1d6855d/test/mocks/generate_token.js
          nock('https://api.sandbox.paypal.com:443')
            .post('/v1/oauth2/token', "grant_type=client_credentials")
            .reply(200, "{\"scope\":\"https://uri.paypal.com/services/invoicing openid https://api.paypal.com/v1/developer/.* https://api.paypal.com/v1/payments/.* https://api.paypal.com/v1/vault/credit-paymentMethod/.* https://api.paypal.com/v1/vault/credit-paymentMethod\",\"access_token\":\"IUIkXAOcYVNHe5zcQajcNGwVWfoUcesp7-YURMLohPI\",\"token_type\":\"Bearer\",\"app_id\":\"APP-2EJ531395M785864S\",\"expires_in\":28800}");

          const executeRequest = nock('https://api.sandbox.paypal.com')
            .post(`/v1/payments/payment/${paymentId}/execute`, { payer_id: PayerID})
            .reply(200, {
              id: 'I-123',
              payer: {
                payment_method: 'paypal',
                status: 'verified',
                payer_info: {
                  email
                }
              }
            });

          request(app)
            .get(`/groups/${group.id}/transactions/1/callback?token=${token}&paymentId=${paymentId}&PayerID=${PayerID}`) // hardcode transaction id
            .end((err, res) => {
              expect(err).to.not.exist;
              expect(executeRequest.isDone()).to.be.true;
              const text = res.text;

              models.Transaction.findAndCountAll({
                include: [
                  { model: models.Subscription },
                  { model: models.User }
                ]
              })
              .then((res) => {
                expect(res.count).to.equal(1);
                const transaction = res.rows[0];
                const user = transaction.User;

                expect(user).to.have.property('email', email);

                expect(text).to.contain(`userid=${user.id}`)
                expect(text).to.contain('has_full_account=false')
                expect(text).to.contain('status=payment_success')

                return group.getUsers();
              })
              .then((users) => {
                const backer = _.find(users, {email: email});
                expect(backer.UserGroup.role).to.equal(roles.BACKER);
                done();
              })
              .catch(done);
            });
        });
      });

      describe('errors', () => {
        it('fails if the interval is wrong', (done) => {
          request(app)
            .post(`/groups/${group.id}/payments/paypal`)
            .send({
              payment: {
                amount: 10,
                currency: 'USD',
                interval: 'abc'
              },
              api_key: application2.api_key
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

        it('fails if it has no amount', (done) => {
          request(app)
            .post(`/groups/${group.id}/payments/paypal`)
            .send({
              payment: {
                currency: 'USD',
                interval: 'month'
              },
              api_key: application2.api_key
            })
            .expect(400, {
              error: {
                code: 400,
                type: 'bad_request',
                message: 'Payment Amount missing.'
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

      it('fails if the accessToken contains live', (done) => {
        const payment = {
          stripeToken: STRIPE_TOKEN,
          amount: CHARGE,
          currency: CURRENCY
        };

        models.StripeAccount.create({ accessToken: 'sk_live_abc'})
        .then((account) => user.setStripeAccount(account))
        .then(() => {
          request(app)
            .post('/groups/' + group.id + '/payments')
            .set('Authorization', 'Bearer ' + user.jwt(application))
            .send({ payment })
            .expect(400, {
              error: {
                code: 400,
                type: 'bad_request',
                message: `You can't use a Stripe live key on ${process.env.NODE_ENV}`,
                payload: { payment }
              }
            })
            .end(done);
        })

      });

      it('fails paying because of a paymentMethod declined', (done) => {
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
          .then(res => {
            expect(res.body.error.detail).to.deep.equal(stripeMock.customers.createError);
            done();
          });
      });

    });

  });

});

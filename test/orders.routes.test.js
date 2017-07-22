import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import sinon from 'sinon';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';
import paymentsLib from '../server/lib/payments';
import models from '../server/models';

const AMOUNT = 1099;
const CURRENCY = 'EUR';
const STRIPE_TOKEN = 'superStripeToken';
const application = utils.data('application');

describe('orders.routes.test.js', () => {
  let user, user2, host, collective, sandbox, processPaymentStub;

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  beforeEach(() => {
    processPaymentStub = sandbox.stub(paymentsLib, 'processPayment', () => Promise.resolve());
  });

  beforeEach(() => utils.resetTestDB());

  // Create a stub for clearbit
  beforeEach(() => utils.clearbitStubBeforeEach(sandbox));

  beforeEach('create a user', () => models.User.create(utils.data('user3')).tap(u => user = u));
  beforeEach('create a user', () => models.User.create(utils.data('user2')).tap(u => user2 = u));
  beforeEach('create a host', () => models.User.create(utils.data('host1')).tap(u => host = u));
  beforeEach('create a collective', () => models.Collective.create(utils.data('collective2')).tap(g => collective = g));
  beforeEach('add host to collective', () => collective.addUserWithRole(host, roles.HOST));
  beforeEach('add user to collective', () => collective.addUserWithRole(user, roles.ADMIN));

  afterEach(() => utils.clearbitStubAfterEach(sandbox));

  /**
   * Post a stripe payment
   */

  describe('#createOrder', () => {

    const payment = {
      stripeToken: STRIPE_TOKEN,
      amount: AMOUNT,
      currency: CURRENCY,
      description: 'hello world'
    }

    describe('manual order', () => {

      describe('fails', () => {

        it('when user is a ADMIN', () => {
          return models.Member.create({
            UserId: user2.id,
            CollectiveId: collective.id,
            role: roles.ADMIN
          })
          .then(() => request(app)
            .post(`/collectives/${collective.id}/orders/manual`)
            .set('Authorization', `Bearer ${user2.jwt()}`)
            .send({
              api_key: application.api_key,
              order: Object.assign({}, payment, {
                email: user2.email,
              })
            })
            .expect(403));
          });

        it('when user is a BACKER', () => {
          return collective.addUserWithRole(user2, roles.BACKER)
          .then(() => request(app)
            .post(`/collectives/${collective.id}/orders/manual`)
            .set('Authorization', `Bearer ${user2.jwt()}`)
            .send({
              api_key: application.api_key,
              order: Object.assign({}, payment, {
                email: user2.email,
              })
            })
            .expect(403));
        });
      });

      describe('with host authorization', () => {

        describe('fails when amount', () => {
          it('is missing', () => {
            request(app)
              .post(`/collectives/${collective.id}/orders/manual`)
              .set('Authorization', `Bearer ${user.jwt()}`)
              .send({
                api_key: application.api_key,
                order: Object.assign({}, payment, {
                  email: user.email,
                  amount: null
                })
              })
              .expect(400)
          });

          it('is 0', () => {
            request(app)
              .post(`/collectives/${collective.id}/orders/manual`)
              .set('Authorization', `Bearer ${user.jwt()}`)
              .send({
                api_key: application.api_key,
                order: Object.assign({}, payment, {
                  email: user.email,
                  amount: 0
                })
              })
              .expect(400)
          });
        });

        describe('when amount is greater than 0', () => {

          it('calls processPayment successfully when order from host', () => request(app)
              .post(`/collectives/${collective.id}/orders/manual`)
              .set('Authorization', `Bearer ${host.jwt()}`)
              .send({
                api_key: application.api_key,
                order: Object.assign({}, payment, {
                  email: host.email,
                  description: 'desc',
                  privateNotes: 'long notes'
                })
              })
              .expect(200)
              .then(() => {
                expect(processPaymentStub.callCount).to.equal(1);
                expect(processPaymentStub.firstCall.args[0]).to.contain({
                  UserId: host.id,
                  CollectiveId: collective.id,
                  currency: collective.currency,
                  amount: AMOUNT,
                  description: 'desc',
                  privateNotes: 'long notes',
                });
              })
              .catch());

          it('calls processPayment successfully when no email is sent with the order', () => request(app)
              .post(`/collectives/${collective.id}/orders/manual`)
              .set('Authorization', `Bearer ${host.jwt()}`)
              .send({
                api_key: application.api_key,
                order: Object.assign({}, payment, {
                  description: 'desc',
                  privateNotes: 'long notes'
                })
              })
              .expect(200)
              .then(() => {
                expect(processPaymentStub.callCount).to.equal(1);
                expect(processPaymentStub.firstCall.args[0]).to.contain({
                  UserId: host.id,
                  CollectiveId: collective.id,
                  currency: collective.currency,
                  amount: AMOUNT,
                  description: 'desc',
                  privateNotes: 'long notes',
                });
              })
              .catch());

          it('calls processPayment successfully when manual order is from a new user but submitted by host', () => {
            return request(app)
              .post(`/collectives/${collective.id}/orders/manual`)
              .set('Authorization', `Bearer ${host.jwt()}`)
              .send({
                api_key: application.api_key,
                order: Object.assign({}, payment, {
                  email: 'newuser@sponsor.com'
                })
              })
              .expect(200)
              .then(() => models.User.findOne({ 
                where: { email: 'newuser@sponsor.com' }
                }))
              .then(newUser => {
                expect(processPaymentStub.callCount).to.equal(1);
                expect(processPaymentStub.firstCall.args[0]).to.contain({
                  UserId: newUser.id,
                  CollectiveId: collective.id,
                  currency: collective.currency,
                  amount: AMOUNT,
                  description: payment.description,
                  privateNotes: null
                });
              })
              .catch();
          });

          it('calls processPayment successfully when manual order is from an existing user who is not the host but submitted by host', () => {
            return request(app)
              .post(`/collectives/${collective.id}/orders/manual`)
              .set('Authorization', `Bearer ${host.jwt()}`)
              .send({
                api_key: application.api_key,
                order: Object.assign({}, payment, {
                  email: user2.email,
                })
              })
              .expect(200)
              .then(() => {
                expect(processPaymentStub.callCount).to.equal(1);
                expect(processPaymentStub.firstCall.args[0]).to.contain({
                  UserId: user2.id,
                  CollectiveId: collective.id,
                  currency: collective.currency,
                  amount: AMOUNT,
                  description: payment.description,
                  privateNotes: null
                });
              })
              .catch();
          });
        });
      });
    });
  });
/*
  TODO: Reenable when we fix Paypal flow

    describe('Paypal recurring order = transaction.Donation;

                expect(subscription).to.have.property('data');
                expect(subscription.data).to.have.property('billingAgreementId');
                expect(subscription.data).to.have.property('plan');
                expect(subscription.isActive).to.equal(true);

                expect(user).to.have.property('email', email);

                expect(text).to.contain(`userid=${user.id}`)
                expect(text).to.contain('has_full_account=false')
                expect(text).to.contain('status=payment_success')

                expect(order).to.have.property('UserId', user.id);
                expect(order).to.have.property('CollectiveId', collective.id);
                expect(order).to.have.property('currency', 'USD');
                expect(order).to.have.property('amount', 1000);
                expect(order).to.have.property('description', `Donation to ${collective.name}`);
                expect(order).to.have.property('SubscriptionId', transaction.Subscription.id);

                return collective.getUsers();
              })
              .then((users) => {
                const backer = _.find(users, {email});
                expect(backer.Member.role).to.equal(roles.BACKER);
                done();
              })
              .catch(done);
            });
        });
      });
    });

    describe('Paypal single donation', () => {
      describe('success', () => {
        let links;
        const token = 'EC-123';
        const paymentId = 'PAY-123';
        const PayerID = 'ABC123';

        beforeEach(() => {
          paypalNock();
        })

        beforeEach((done) => {
          request(app)
            .post(`/collectives/${collective.id}/payments/paypal`)
            .send({
              api_key: application.api_key,
              payment: {
                amount: 10,
                currency: 'USD'
              }
            })
            .end((err, res) => {
              expect(err).to.not.exist;
              ({ links } = res.body);
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

            expect(transaction).to.have.property('CollectiveId', collective.id);
            expect(transaction).to.have.property('currency', 'USD');
            expect(transaction).to.have.property('tags');
            expect(transaction).to.have.property('SubscriptionId', null);
            expect(transaction).to.have.property('amount', 10);

            done();
          })
          .catch(done);
        });

        it('executes the billing agreement', (done) => {
          const email = 'testemail@test.com';
          let transaction;

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
            .get(`/collectives/${collective.id}/transactions/1/callback?token=${token}&paymentId=${paymentId}&PayerID=${PayerID}`) // hardcode transaction id
            .end((err, res) => {
              expect(err).to.not.exist;
              expect(executeRequest.isDone()).to.be.true;
              const { text } = res;

              models.Transaction.findAndCountAll({
                include: [
                  { model: models.Subscription },
                  { model: models.User },
                  { model: models.Order }
                ]
              })
              .then((res) => {
                expect(res.count).to.equal(1);
                transaction = res.rows[0];
                const user = transaction.User;
                const donation = transaction.Donation;

                expect(user).to.have.property('email', email);

                expect(text).to.contain(`userid=${user.id}`)
                expect(text).to.contain('has_full_account=false')
                expect(text).to.contain('status=payment_success')

                expect(order).to.have.property('UserId', user.id);
                expect(order).to.have.property('CollectiveId', collective.id);
                expect(order).to.have.property('currency', 'USD');
                expect(order).to.have.property('amount', 1000);
                expect(order).to.have.property('description', `Donation to ${collective.name}`);

                return collective.getUsers();
              })
              .then((users) => {
                const backer = _.find(users, {email});
                expect(backer.Member.role).to.equal(roles.BACKER);
              })
              .then(() => models.Activity.findAndCountAll({ where: { type: "collective.transaction.created" } }))
              .then(res => {
                expect(res.count).to.equal(1);
                const activity = res.rows[0].get();
                expect(activity).to.have.property('CollectiveId', collective.id);
                expect(activity).to.have.property('UserId', transaction.UserId);
                expect(activity).to.have.property('TransactionId', transaction.id);
                expect(activity.data.transaction).to.have.property('id', transaction.id);
                expect(activity.data.collective).to.have.property('id', collective.id);
                expect(activity.data.user).to.have.property('id', transaction.UserId);
              })
              .then(() => done())
              .catch(done);
            });
        });
      });

      describe('errors', () => {
        it('fails if the interval is wrong', (done) => {
          request(app)
            .post(`/collectives/${collective.id}/payments/paypal`)
            .send({
              api_key: application.api_key,
              payment: {
                amount: 10,
                currency: 'USD',
                interval: 'abc'
              }
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
            .post(`/collectives/${collective.id}/payments/paypal`)
            .send({
              api_key: application.api_key,
              payment: {
                currency: 'USD',
                interval: 'month'
              }
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
*/
});
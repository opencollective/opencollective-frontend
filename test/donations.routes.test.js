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
const userData = utils.data('user3');
const userData2 = utils.data('user2');
const groupData = utils.data('group2');

describe('donations.routes.test.js', () => {
  let user, user2, group, sandbox, createPaymentStub, processPaymentStub;

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  beforeEach(() => {
    createPaymentStub = sandbox.stub(paymentsLib, 'createPayment', () => Promise.resolve());
    processPaymentStub = sandbox.stub(paymentsLib, 'processPayment', () => Promise.resolve());
  });

  beforeEach(() => utils.resetTestDB());

  // Create a stub for clearbit
  beforeEach(() => utils.clearbitStubBeforeEach(sandbox));

  beforeEach('create a user', () => models.User.create(userData).tap(u => user = u));

  beforeEach('create a second user', () => models.User.create(userData2).tap(u => user2 = u));

  beforeEach('create group with user as first member', (done) => {
    request(app)
      .post('/groups')
      .send({
        api_key: application.api_key,
        group: Object.assign(groupData, { users: [{ email: user.email, role: roles.HOST}]})
      })
      .expect(200)
      .end((e, res) => {
        expect(e).to.not.exist;
        models.Group
          .findById(parseInt(res.body.id))
          .then((g) => {
            group = g;
            done();
          })
          .catch(done);
      });
  });

  afterEach(() => utils.clearbitStubAfterEach(sandbox));


  describe('#list', () => {

    const createDonation = (index, UserId = user.id, GroupId = group.id) => {
      const donations = utils.data('donations');
      const donation = Object.assign({}, donations[index], { GroupId, UserId });
      return models.Donation.create(donation)
    }

    beforeEach('create donation', () => createDonation(0));
    beforeEach('create donation 2', () => createDonation(1));
    beforeEach('create donation 3', () => createDonation(2));

    it('THEN returns 200', (done) => {
      request(app)
      .get(`/groups/${group.id}/donations?api_key=${application.api_key}`)
      .expect(200)
      .then(res => {
        const donations = res.body;
        expect(donations).to.have.length(3);
        done();
      })
    });

    describe('WHEN specifying per_page', () => {
      const per_page = 2;
      let response;

      beforeEach('get 2 per page', (done) => {
        request(app)
        .get(`/groups/${group.id}/donations?api_key=${application.api_key}`)
        .send({ per_page })
        .expect(200)
        .then(res => {
          response = res;
          done();
        })
      });

      it('THEN gets first page', () => {
        const donations = response.body;
        expect(donations.length).to.equal(per_page);
        expect(donations[0].id).to.equal(1);

        const { headers } = response;
        expect(headers).to.have.property('link');
        expect(headers.link).to.contain('next');
        expect(headers.link).to.contain('page=2');
        expect(headers.link).to.contain('current');
        expect(headers.link).to.contain('page=1');
        expect(headers.link).to.contain(`per_page=${per_page}`);
        expect(headers.link).to.contain(`/groups/${group.id}/donations`);
        const tot = 3;
        expect(headers.link).to.contain(`/groups/${group.id}/donations?page=${Math.ceil(tot/per_page)}&per_page=${per_page}>; rel="last"`);
      });
    });

    describe('WHEN getting page 2', () => {
      const page = 2;
      let response;

      beforeEach('get page 2 with one per page', (done) => {
        request(app)
        .get(`/groups/${group.id}/donations?api_key=${application.api_key}`)
        .send({ page, per_page: 1 })
        .expect(200)
        .then(res => {
          response = res;
          done();
        })
      });

      it('THEN gets 2nd page', () => {
        const donations = response.body;
        expect(donations.length).to.equal(1);
        expect(donations[0].id).to.equal(2);

        const { headers } = response;
        expect(headers).to.have.property('link');
        expect(headers.link).to.contain('next');
        expect(headers.link).to.contain('page=3');
        expect(headers.link).to.contain('current');
        expect(headers.link).to.contain('page=2');
      });
    });

    describe('WHEN specifying since_id', () => {
      const since_id = 2;
      let response;

      beforeEach('get expenses since id 2', (done) => {
        request(app)
        .get(`/groups/${group.id}/donations?api_key=${application.api_key}`)
        .send({ since_id })
        .expect(200)
        .then(res => {
          response = res;
          done();
        })
      });

      it('THEN returns donations above ID', () => {
        const donations = response.body;
        expect(donations.length).to.be.equal(1);
        donations.forEach(e => expect(e.id >= since_id).to.be.true);
        const { headers } = response;
        expect(headers.link).to.be.empty;
      });
    });
  });

  /**
   * Post a stripe payment
   */

  describe('#createDonation', () => {

    const payment = {
      stripeToken: STRIPE_TOKEN,
      amount: AMOUNT,
      currency: CURRENCY,
      description: 'hello world'
    }


    describe('stripe donation', () => {
      it('calls createPayment successfully when payment by a group\'s user', () => {
        return request(app)
        .post(`/groups/${group.id}/donations/stripe`)
        .send({
          api_key: application.api_key,
          payment: Object.assign({}, payment, {email: user.email})
        })
        .expect(200)
        .toPromise()
        .then((res) => {
          expect(createPaymentStub.callCount).to.equal(1);
          expect(createPaymentStub.firstCall.args[0].user.email).to.equal(user.email);
          expect(createPaymentStub.firstCall.args[0].group.slug).to.equal(group.slug);
          expect(createPaymentStub.firstCall.args[0].payment).to.deep.equal(
            Object.assign({}, payment, {
              description: 'hello world',
              interval: undefined,
              notes: undefined}));
        })
        .catch();
      });

      it('calls createPayment successfully when payment by a new, anonymous user', () => {
        return request(app)
        .post(`/groups/${group.id}/donations/stripe`)
        .send({
          api_key: application.api_key,
          payment: Object.assign({}, payment, {email: 'anonymous@anon.com'})
        })
        .expect(200)
        .then(() => {
          expect(createPaymentStub.callCount).to.equal(1);
          expect(createPaymentStub.firstCall.args[0].user.email).to.equal('anonymous@anon.com');
          expect(createPaymentStub.firstCall.args[0].group.slug).to.equal(group.slug);
          expect(createPaymentStub.firstCall.args[0].payment).to.deep.equal(
            Object.assign({}, payment, {
              description: undefined,
              interval: undefined,
              notes: undefined}));
        })
        .catch();
      });

      it('Payment success by an existing user in the database', () => {
        return request(app)
        .post(`/groups/${group.id}/donations/stripe`)
        .send({
          api_key: application.api_key,
          payment: Object.assign({}, payment, {email: user2.email})
        })
        .expect(200)
        .then(() => {
          expect(createPaymentStub.callCount).to.equal(1);
          expect(createPaymentStub.firstCall.args[0].user.email).to.equal(user2.email);
          expect(createPaymentStub.firstCall.args[0].group.slug).to.equal(group.slug);
          expect(createPaymentStub.firstCall.args[0].payment).to.deep.equal(
            Object.assign({}, payment, {
              description: undefined,
              interval: undefined,
              notes: undefined}));
        })
        .catch();
      });

      it('Recurring payment success', () => {
        return request(app)
        .post(`/groups/${group.id}/donations/stripe`)
        .send({
          api_key: application.api_key,
          payment: Object.assign({}, payment, {
            email: user.email,
            interval: 'month',
            description: 'desc',
            notes: 'long notes'
          })
        })
        .expect(200)
        .then(() => {
          expect(createPaymentStub.callCount).to.equal(1);
          expect(createPaymentStub.firstCall.args[0].user.email).to.equal(user.email);
          expect(createPaymentStub.firstCall.args[0].group.slug).to.equal(group.slug);
          expect(createPaymentStub.firstCall.args[0].payment).to.deep.equal(
            Object.assign({}, payment, {
              description: 'desc',
              interval: 'month',
              notes: 'long notes'}));
        })
        .catch();
      });

    });

    describe('manual donation', () => {

      describe('fails', () => {

        it('when user is a MEMBER', () => {
          return models.UserGroup.create({
            UserId: user2.id,
            GroupId: group.id,
            role: roles.MEMBER
          })
          .then(() => request(app)
            .post(`/groups/${group.id}/donations/manual`)
            .set('Authorization', `Bearer ${user2.jwt()}`)
            .send({
              api_key: application.api_key,
              donation: Object.assign({}, payment, {
                email: user2.email,
              })
            })
            .expect(403));
          });

        it('when user is a BACKER', () => {
          return group.addUserWithRole(user2, roles.BACKER)
          .then(() => request(app)
            .post(`/groups/${group.id}/donations/manual`)
            .set('Authorization', `Bearer ${user2.jwt()}`)
            .send({
              api_key: application.api_key,
              donation: Object.assign({}, payment, {
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
              .post(`/groups/${group.id}/donations/manual`)
              .set('Authorization', `Bearer ${user.jwt()}`)
              .send({
                api_key: application.api_key,
                donation: Object.assign({}, payment, {
                  email: user.email,
                  amount: null
                })
              })
              .expect(400)
          });

          it('is 0', () => {
            request(app)
              .post(`/groups/${group.id}/donations/manual`)
              .set('Authorization', `Bearer ${user.jwt()}`)
              .send({
                api_key: application.api_key,
                donation: Object.assign({}, payment, {
                  email: user.email,
                  amount: 0
                })
              })
              .expect(400)
          });
        });

        describe('when amount is greater than 0', () => {

          it('calls processPayment successfully when donation from host', () => {
            request(app)
              .post(`/groups/${group.id}/donations/manual`)
              .set('Authorization', `Bearer ${user.jwt()}`)
              .send({
                api_key: application.api_key,
                donation: Object.assign({}, payment, {
                  email: user.email,
                  title: 'desc',
                  notes: 'long notes'
                })
              })
              .expect(200)
              .then(() => {
                expect(processPaymentStub.callCount).to.equal(1);
                expect(processPaymentStub.firstCall.args[0]).to.contain({
                  UserId: user.id,
                  GroupId: group.id,
                  currency: group.currency,
                  amount: AMOUNT,
                  title: 'desc',
                  notes: 'long notes',
                });
              })
              .catch();
          });

          it('calls processPayment successfully when no email is sent with the donation', () => {
            request(app)
              .post(`/groups/${group.id}/donations/manual`)
              .set('Authorization', `Bearer ${user.jwt()}`)
              .send({
                api_key: application.api_key,
                donation: Object.assign({}, payment, {
                  title: 'desc',
                  notes: 'long notes'
                })
              })
              .expect(200)
              .then(() => {
                expect(processPaymentStub.callCount).to.equal(1);
                expect(processPaymentStub.firstCall.args[0]).to.contain({
                  UserId: user.id,
                  GroupId: group.id,
                  currency: group.currency,
                  amount: AMOUNT,
                  title: 'desc',
                  notes: 'long notes',
                });
              })
              .catch();
          });

          it('calls processPayment successfully when manual donation is from a new user but submitted by host', () => {
            return request(app)
              .post(`/groups/${group.id}/donations/manual`)
              .set('Authorization', `Bearer ${user.jwt()}`)
              .send({
                api_key: application.api_key,
                donation: Object.assign({}, payment, {
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
                  GroupId: group.id,
                  currency: group.currency,
                  amount: AMOUNT,
                  title: null,
                  notes: null
                });
              })
              .catch();
          });

          it('calls processPayment successfully when manual donation is from an existing user who is not the host but submitted by host', () => {
            return request(app)
              .post(`/groups/${group.id}/donations/manual`)
              .set('Authorization', `Bearer ${user.jwt()}`)
              .send({
                api_key: application.api_key,
                donation: Object.assign({}, payment, {
                  email: user2.email,
                })
              })
              .expect(200)
              .then(() => {
                expect(processPaymentStub.callCount).to.equal(1);
                expect(processPaymentStub.firstCall.args[0]).to.contain({
                  UserId: user2.id,
                  GroupId: group.id,
                  currency: group.currency,
                  amount: AMOUNT,
                  title: null,
                  notes: null
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

    describe('Paypal recurring donation', () => {

      beforeEach(() => {
        paypalNock();
      })

      describe('success', () => {
        let links;
        const token = 'EC-123';

        beforeEach((done) => {
          request(app)
            .post(`/groups/${group.id}/payments/paypal`)
            .send({
              api_key: application.api_key,
              payment: {
                amount: 10,
                currency: 'USD',
                interval: 'month'
              }
            })
            .end((err, res) => {
              expect(err).to.not.exist;
              ({ links } = res.body);
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
              const { text } = res;

              models.Transaction.findAndCountAll({
                include: [
                  { model: models.Subscription },
                  { model: models.User },
                  { model: models.Donation }
                ]
              })
              .then((res) => {
                expect(res.count).to.equal(1);
                const transaction = res.rows[0];
                const subscription = transaction.Subscription;
                const user = transaction.User;
                const donation = transaction.Donation;

                expect(subscription).to.have.property('data');
                expect(subscription.data).to.have.property('billingAgreementId');
                expect(subscription.data).to.have.property('plan');
                expect(subscription.isActive).to.equal(true);

                expect(user).to.have.property('email', email);

                expect(text).to.contain(`userid=${user.id}`)
                expect(text).to.contain('has_full_account=false')
                expect(text).to.contain('status=payment_success')

                expect(donation).to.have.property('UserId', user.id);
                expect(donation).to.have.property('GroupId', group.id);
                expect(donation).to.have.property('currency', 'USD');
                expect(donation).to.have.property('amount', 1000);
                expect(donation).to.have.property('title', `Donation to ${group.name}`);
                expect(donation).to.have.property('SubscriptionId', transaction.Subscription.id);

                return group.getUsers();
              })
              .then((users) => {
                const backer = _.find(users, {email});
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
        let links;
        const token = 'EC-123';
        const paymentId = 'PAY-123';
        const PayerID = 'ABC123';

        beforeEach(() => {
          paypalNock();
        })

        beforeEach((done) => {
          request(app)
            .post(`/groups/${group.id}/payments/paypal`)
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

            expect(transaction).to.have.property('GroupId', group.id);
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
            .get(`/groups/${group.id}/transactions/1/callback?token=${token}&paymentId=${paymentId}&PayerID=${PayerID}`) // hardcode transaction id
            .end((err, res) => {
              expect(err).to.not.exist;
              expect(executeRequest.isDone()).to.be.true;
              const { text } = res;

              models.Transaction.findAndCountAll({
                include: [
                  { model: models.Subscription },
                  { model: models.User },
                  { model: models.Donation }
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

                expect(donation).to.have.property('UserId', user.id);
                expect(donation).to.have.property('GroupId', group.id);
                expect(donation).to.have.property('currency', 'USD');
                expect(donation).to.have.property('amount', 1000);
                expect(donation).to.have.property('title', `Donation to ${group.name}`);

                return group.getUsers();
              })
              .then((users) => {
                const backer = _.find(users, {email});
                expect(backer.UserGroup.role).to.equal(roles.BACKER);
              })
              .then(() => models.Activity.findAndCountAll({ where: { type: "group.transaction.created" } }))
              .then(res => {
                expect(res.count).to.equal(1);
                const activity = res.rows[0].get();
                expect(activity).to.have.property('GroupId', group.id);
                expect(activity).to.have.property('UserId', transaction.UserId);
                expect(activity).to.have.property('TransactionId', transaction.id);
                expect(activity.data.transaction).to.have.property('id', transaction.id);
                expect(activity.data.group).to.have.property('id', group.id);
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
            .post(`/groups/${group.id}/payments/paypal`)
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
            .post(`/groups/${group.id}/payments/paypal`)
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
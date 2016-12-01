import _ from 'lodash';
import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';
import nock from 'nock';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';
import * as donationsLib from '../server/lib/donations';
import models from '../server/models';

const CHARGE = 10.99;
const CURRENCY = 'EUR';
const STRIPE_TOKEN = 'superStripeToken';
const EMAIL = 'paypal@email.com';
const application = utils.data('application');
const userData = utils.data('user3');
const groupData = utils.data('group2');
import paypalNock from './mocks/paypal.nock';

describe('donations.routes.test.js', () => {
  let user, group, group2, sandbox;

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  beforeEach(() => {
    sandbox.stub(donationsLib, 'processDonation');
  });

  beforeEach(() => utils.resetTestDB());

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  beforeEach('create a user', () => models.User.create(userData).tap(u => user = u));

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

  beforeEach('create second group with user as first member', (done) => {
    request(app)
      .post('/groups')
      .send({
        api_key: application.api_key,
        group: Object.assign(utils.data('group1'), { users: [{ email: user.email, role: roles.HOST}]}),
        role: roles.HOST
      })
      .expect(200)
      .end((e, res) => {
        expect(e).to.not.exist;
        models.Group
          .findById(parseInt(res.body.id))
          .tap((g) => {
            group2 = g;
            done();
          })
          .catch(done);
      });
  });

  beforeEach('create stripe account', (done) => {
    models.StripeAccount.create({
      accessToken: 'abc'
    })
    .then((account) => user.setStripeAccount(account))
    .tap(() => done())
    .catch(done);
  });

  beforeEach('create paypal account', (done) => {
    models.ConnectedAccount.create({
      provider: 'paypal',
      // Sandbox api keys
      clientId: 'AZaQpRstiyI1ymEOGUXXuLUzjwm3jJzt0qrI__txWlVM29f0pTIVFk5wM9hLY98w5pKCE7Rik9QYvdYA',
      secret: 'EILQQAMVCuCTyNDDOWTGtS7xBQmfzdMcgSVZJrCaPzRbpGjQFdd8sylTGE-8dutpcV0gJkGnfDE0PmD8'
    })
    .then((account) => account.setUser(user))
    .tap(() => done())
    .catch(done);
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });


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
   * Post a payment.
   */
  describe('#postPayments', () => {

    describe('Payment success by a group\'s user', () => {

      beforeEach((done) => {
        request(app)
          .post(`/groups/${group.id}/payments`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .send({
            api_key: application.api_key,
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

      it('successfully creates a paymentMethod with the UserId', (done) => {
        models.PaymentMethod
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('UserId', user.id);
            expect(res.rows[0]).to.have.property('token', STRIPE_TOKEN);
            expect(res.rows[0]).to.have.property('service', 'stripe');
            done();
          })
          .catch(done);
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
              `Donation to ${group.name}`);
            done();
          })
          .catch(done);
      });

    });

    describe('Next payment success with a same stripe token', () => {

      const CHARGE2 = 1.99;

      beforeEach((done) => {
        request(app)
          .post(`/groups/${group.id}/payments`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .send({
            api_key: application.api_key,
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

      beforeEach((done) => {
        request(app)
          .post(`/groups/${group.id}/payments`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .send({
            api_key: application.api_key,
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

      it('does not re-create a paymentMethod', (done) => {
        models.PaymentMethod
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            done();
          })
          .catch(done);
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

    });

    describe('Payment success by anonymous user', () => {

      const data = {
        stripeToken: STRIPE_TOKEN,
        amount: CHARGE,
        currency: CURRENCY,
        description: 'super description',
        tags: ['tag1', 'tag2'],
        status: 'super status',
        link: 'www.opencollective.com',
        comment: 'super comment',
        email: userData.email
      };

      beforeEach('successfully makes a anonymous payment', (done) => {
        request(app)
          .post(`/groups/${group2.id}/payments`)
          .send({
            api_key: application.api_key,
            payment: data
          })
          .expect(200)
          .end((e) => {
            expect(e).to.not.exist;
            done();
          });
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

      it('successfully creates a user', (done) => {

        models.User.findAndCountAll({
          where: {
              email: userData.email.toLowerCase()
            }
        })
        .then((res) => {
          expect(res.count).to.equal(1);
          expect(res.rows[0]).to.have.property('email', userData.email.toLowerCase());
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
            expect(res.rows[0]).to.have.property('title', `Donation to ${group2.name}`);
            done();
          })
          .catch(done);
      });

    });

    describe('Recurring payment success', () => {

      const data = {
        stripeToken: STRIPE_TOKEN,
        amount: 10,
        currency: CURRENCY,
        interval: 'month',
        link: 'www.opencollective.com',
        email: EMAIL
      };


      beforeEach((done) => {
        request(app)
          .post(`/groups/${group2.id}/payments`)
          .send({
            api_key: application.api_key,
            payment: data
          })
          .expect(200)
          .end(e => {
            expect(e).to.not.exist;
            done();
          });
      });

      it('successfully creates a paymentMethod', (done) => {
        models.PaymentMethod
          .findAndCountAll({})
          .then((res) => {
            expect(res.count).to.equal(1);
            expect(res.rows[0]).to.have.property('UserId', 2);
            done();
          })
          .catch(done);
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
            expect(res.rows[0]).to.have.property('title', `Monthly donation to ${group2.name}`);
            done();
          })
          .catch(done)
      });

      it('does not create a transaction', (done) => {
        models.Transaction
          .count({})
          .then((res) => {
            expect(res).to.equal(0);
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
            expect(subscription).to.have.property('interval', 'month');
            expect(subscription).to.have.property('data');
            expect(subscription).to.have.property('isActive', false);
            expect(subscription).to.have.property('currency', CURRENCY);
            done();
          })
          .catch(done);
      });

      it('fails if the interval is not month or year', (done) => {

        request(app)
          .post(`/groups/${group2.id}/payments`)
          .send({
            api_key: application.api_key,
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

    describe('Payment errors', () => {

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
            .post(`/groups/${group.id}/payments`)
            .set('Authorization', `Bearer ${user.jwt()}`)
            .send({
              api_key: application.api_key,
              payment
            })
            .expect(400, {
              error: {
                code: 400,
                type: 'bad_request',
                message: `You can't use a Stripe live key on ${process.env.NODE_ENV}`
              }
            })
            .end(done);
        })
      });
    });
  });
});
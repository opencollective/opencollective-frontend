import nock from 'nock';
import app from '../server/index';
import jwt from 'jsonwebtoken';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import config from 'config';
import * as utils from '../test/utils';
import stripeMock from './mocks/stripe';
import Promise from 'bluebird';
import models from '../server/models';
import roles from '../server/constants/roles';

const STRIPE_URL = 'https://api.stripe.com:443';
const transactionsData = utils.data('transactions1').transactions;

describe('subscriptions.routes.test.js', () => {
  let group;
  let user;
  let application;
  let paymentMethod;

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.create(utils.data('user1')).tap((u => user = u)));

  beforeEach(() => models.Group.create(utils.data('group1')).tap((g => group = g)));

  beforeEach(() => group.addUserWithRole(user, roles.HOST));

  // create stripe account
  beforeEach(() => {
    models.StripeAccount.create({
      accessToken: 'sktest_123'
    })
    .then((account) => user.setStripeAccount(account));
  });

  // Create a paymentMethod.
  beforeEach(() => models.PaymentMethod.create(utils.data('paymentMethod2')).tap(c => paymentMethod = c));

  /**
   * Get the subscriptions of a user
   */
  describe('#getAll', () => {
    // Create transactions for group1.
    beforeEach(() =>
      Promise.map(transactionsData, transaction =>
        models.Subscription.create(utils.data('subscription1'))
          .then(subscription => models.Transaction.createFromPayload({
            transaction,
            user,
            group,
            subscription
          })
        ))
    );

    it('fails if no authorization provided', () =>
      request(app)
        .get('/subscriptions')
        .expect(401, {
          error: {
            code: 401,
            type: 'unauthorized',
            message: 'User is not authenticated'
          }
        })
    );

    it('successfully has access to the subscriptions', (done) => {
      request(app)
        .get('/subscriptions')
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.length).to.be.equal(transactionsData.length);
          res.body.forEach(sub => {
            expect(sub).to.be.have.property('stripeSubscriptionId')
            expect(sub).to.be.have.property('Transactions')
            expect(sub.Transactions[0]).to.be.have.property('Group')
          });
          done();
        });
    });
  });

  /**
   * Cancel subscription
   */
  describe('#cancel', () => {

    const subscription = utils.data('subscription1');
    let transaction;
    const nocks = {};

    beforeEach((done) => {
      models.Subscription.create(subscription)
      .then(subscription => models.Transaction.createFromPayload({
         transaction: transactionsData[0],
        user,
        group,
        subscription,
        paymentMethod
      }))
      .tap(t => transaction = t)
      .then(() => done())
      .catch(done)
    });

    beforeEach(() => {
      nocks['subscriptions.delete'] = nock(STRIPE_URL)
        .delete(`/v1/customers/${paymentMethod.customerId}/subscriptions/${subscription.stripeSubscriptionId}`)
        .reply(200, stripeMock.subscriptions.create);
    });

    afterEach(() => nock.cleanAll());

    it('fails if if no authorization provided', (done) => {
      request(app)
        .post(`/subscriptions/${transaction.SubscriptionId}/cancel`)
        .expect(401, {
          error: {
            code: 401,
            type: 'unauthorized',
            message: 'User is not authenticated'
          }
        })
        .end(done);
    });

    it('fails if the token expired', (done) => {
      const expiredToken = jwt.sign({
        user,
        scope: 'subscriptions'
      }, config.keys.opencollective.secret, {
        expiresIn: -1,
        subject: user.id,
        issuer: config.host.api,
        audience: application.id
      });

      request(app)
        .post(`/subscriptions/${transaction.SubscriptionId}/cancel`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .end((err, res) => {
          expect(res.body.error.code).to.be.equal(401);
          expect(res.body.error.message).to.be.equal('jwt expired');
          done();
        });
    });

    it('fails if the subscription does not exist', (done) => {
      const token = user.jwt(application, {
        scope: 'subscriptions'
      });
      request(app)
        .post('/subscriptions/12345/cancel')
        .set('Authorization', `Bearer ${token}`)
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'No subscription found with id 12345'
          }
        })
        .end(done);
    });

    it('cancels the subscription', (done) => {
       request(app)
        .post(`/subscriptions/${transaction.SubscriptionId}/cancel`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.success).to.be.true;
          expect(nocks['subscriptions.delete'].isDone()).to.be.true;

          models.Subscription.findAll({})
            .then(subscriptions => {
              const sub = subscriptions[0];
              expect(sub.isActive).to.be.false;
              expect(sub.deactivatedAt).to.be.ok;
              done();
            })
            .then(() => models.Activity.findOne({where: {type: 'subscription.canceled'}}))
            .then(activity => {
              expect(activity).to.be.defined;
              expect(activity.GroupId).to.be.equal(group.id);
              expect(activity.UserId).to.be.equal(user.id);
              expect(activity.data.subscriptionId).to.be.equal(transaction.SubscriptionId);
              expect(activity.data.group.id).to.be.equal(group.id);
              expect(activity.data.user.id).to.be.equal(user.id);
            })
            .catch(done);
        });
    });
  });
});

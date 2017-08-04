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

  beforeEach('create a user', () => models.User.createUserWithCollective(utils.data('user3')).tap(u => user = u));
  beforeEach('create a user', () => models.User.createUserWithCollective(utils.data('user2')).tap(u => user2 = u));
  beforeEach('create a host', () => models.User.createUserWithCollective(utils.data('host1')).tap(u => host = u));
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
            CreatedByUserId: user2.id,
            FromCollectiveId: user2.CollectiveId,
            ToCollectiveId: collective.id,
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
                  totalAmount: null
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
                  totalAmount: 0
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
                  privateMessage: 'long notes',
                  totalAmount: AMOUNT
                })
              })
              .expect(200)
              .then(() => {
                expect(processPaymentStub.callCount).to.equal(1);
                expect(processPaymentStub.firstCall.args[0]).to.contain({
                  CreatedByUserId: host.id,
                  ToCollectiveId: collective.id,
                  currency: collective.currency,
                  totalAmount: AMOUNT,
                  description: 'desc',
                  privateMessage: 'long notes',
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
                  privateMessage: 'long notes',
                  totalAmount: AMOUNT
                })
              })
              .expect(200)
              .then(() => {
                expect(processPaymentStub.callCount).to.equal(1);
                expect(processPaymentStub.firstCall.args[0]).to.contain({
                  CreatedByUserId: host.id,
                  ToCollectiveId: collective.id,
                  currency: collective.currency,
                  totalAmount: AMOUNT,
                  description: 'desc',
                  privateMessage: 'long notes',
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
                  email: 'newuser@sponsor.com',
                  totalAmount: AMOUNT
                })
              })
              .expect(200)
              .then(() => models.User.findOne({ 
                where: { email: 'newuser@sponsor.com' }
                }))
              .then(newUser => {
                expect(processPaymentStub.callCount).to.equal(1);
                expect(processPaymentStub.firstCall.args[0]).to.contain({
                  CreatedByUserId: newUser.id,
                  ToCollectiveId: collective.id,
                  currency: collective.currency,
                  totalAmount: AMOUNT,
                  description: payment.description,
                  privateMessage: null
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
                  totalAmount: AMOUNT
                })
              })
              .expect(200)
              .then(() => {
                expect(processPaymentStub.callCount).to.equal(1);
                expect(processPaymentStub.firstCall.args[0]).to.contain({
                  CreatedByUserId: user2.id,
                  ToCollectiveId: collective.id,
                  currency: collective.currency,
                  totalAmount: AMOUNT,
                  description: payment.description,
                  privateMessage: null
                });
              })
              .catch();
          });
        });
      });
    });
  });
});
import nock from 'nock';
import sinon from 'sinon';
import nodemailer from 'nodemailer';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import config from 'config';
import jwt from 'jsonwebtoken';
import Promise from 'bluebird';

import app from '../server/index';
import * as utils from '../test/utils';
import stripeMock from './mocks/stripe';
import models from '../server/models';
import roles from '../server/constants/roles';
import * as donationsLib from '../server/lib/donations';


const application = utils.data('application');

const STRIPE_URL = 'https://api.stripe.com:443';
const donationsData = utils.data('donations');

describe('subscriptions.routes.test.js', () => {
  let group, user, paymentMethod, sandbox;

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  beforeEach(() => {
    sandbox.stub(donationsLib, 'processDonation');
  });

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

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  /**
   * Get the subscriptions of a user
   */
  describe('#getAll', () => {
    // Create donation for group1.
    beforeEach(() =>
      Promise.map(donationsData, donation =>
        models.Subscription.create(utils.data('subscription1'))
          .then(subscription => models.Donation.create({
            ...donation,
            UserId: user.id,
            GroupId: group.id,
            SubscriptionId: subscription.id
          })
        ))
    );

    it('fails if no authorization provided', () =>
      request(app)
        .get(`/subscriptions?api_key=${application.api_key}`)
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
        .get(`/subscriptions?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.length).to.be.equal(donationsData.length);
          res.body.forEach(sub => {
            expect(sub).to.be.have.property('stripeSubscriptionId')
            expect(sub).to.be.have.property('Donation')
            expect(sub.Donation).to.be.have.property('Group')
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
    let donation, nm;
    const nocks = {};

    // create a fake nodemailer transport
    beforeEach(() => {
      config.mailgun.user = 'xxxxx';
      config.mailgun.password = 'password';

      nm = nodemailer.createTransport({
            name: 'testsend',
            service: 'Mailgun',
            sendMail (data, callback) {
                callback();
            },
            logger: false
          });
      sinon.stub(nodemailer, 'createTransport', () => nm);
    });

    // stub the transport
    beforeEach(() => sinon.stub(nm, 'sendMail', (object, cb) => cb(null, object)));

    afterEach(() => nm.sendMail.restore());

    beforeEach(() => {
      return models.Subscription.create(subscription)
        .then(sub => models.Donation.create({
          ...donationsData[0],
          UserId: user.id,
          GroupId: group.id,
          PaymentMethodId: paymentMethod.id,
          SubscriptionId: sub.id
        }))
        .tap(d => donation = d)
        .catch()
    });

    beforeEach(() => {
      nocks['subscriptions.delete'] = nock(STRIPE_URL)
        .delete(`/v1/customers/${paymentMethod.customerId}/subscriptions/${subscription.stripeSubscriptionId}`)
        .reply(200, stripeMock.subscriptions.create);
    });

    afterEach(() => nock.cleanAll());

    it('fails if if no authorization provided', (done) => {
      request(app)
        .post(`/subscriptions/${donation.SubscriptionId}/cancel?api_key=${application.api_key}`)
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
        .post(`/subscriptions/${donation.SubscriptionId}/cancel?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .end((err, res) => {
          expect(res.body.error.code).to.be.equal(401);
          expect(res.body.error.message).to.be.equal('jwt expired');
          done();
        });
    });

    it('fails if the subscription does not exist', (done) => {
      const token = user.jwt({ scope: 'subscriptions' });
      request(app)
        .post(`/subscriptions/12345/cancel?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'No subscription found with id 12345. Please contact support@opencollective.com for help.'
          }
        })
        .end(done);
    });

    it('cancels the subscription', (done) => {
       request(app)
        .post(`/subscriptions/${donation.SubscriptionId}/cancel?api_key=${application.api_key}`)
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
            })
            .then(() => models.Activity.findOne({where: {type: 'subscription.canceled'}}))
            .then(activity => {
              expect(activity).to.be.defined;
              expect(activity.GroupId).to.be.equal(group.id);
              expect(activity.UserId).to.be.equal(user.id);
              expect(activity.data.subscription.id).to.be.equal(donation.SubscriptionId);
              expect(activity.data.group.id).to.be.equal(group.id);
              expect(activity.data.user.id).to.be.equal(user.id);
            })
            .then(() => {
              const subject = nm.sendMail.lastCall.args[0].subject;
              const html = nm.sendMail.lastCall.args[0].html;
              expect(subject).to.contain('Subscription canceled to Scouts');
              expect(html).to.contain('€20/month has been canceled');
              done();
            })
            .catch(done);
        });
    });
  });
});

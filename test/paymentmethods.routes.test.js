import _ from 'lodash';
import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest';
import * as utils from '../test/utils';
import models from '../server/models';

const paypalPaymentMethod = utils.data('paymentMethod1');
const stripePaymentMethod = utils.data('paymentMethod2');

describe('paymentMethods.routes.test.js', () => {

  let application;
  let user;
  let user2;
  let paymentMethod1;

  beforeEach(() => utils.cleanAllDb().tap(a => application = a));

  // Create users.
  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user = u));

  beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

  // Create paymentMethod.
  beforeEach(() => {
    const data = _.extend(paypalPaymentMethod, { UserId: user.id });
    return models.PaymentMethod.create(data).tap(pm => paymentMethod1 = pm);
  });

  beforeEach(() => {
    const data = _.extend(stripePaymentMethod, { UserId: user.id });
    return models.PaymentMethod.create(data);
  });

  /**
   * Get user's groups.
   */
  describe('#getUserGroups', () => {

    it('fails getting another user\'s paymentMethods', (done) => {
      request(app)
        .get(`/users/${user.id}/payment-methods`)
        .set('Authorization', `Bearer ${user2.jwt(application)}`)
        .expect(403)
        .end(e => {
          expect(e).to.not.exist;
          done();
        });
    });

    it('successfully get a user\'s paymentMethod', (done) => {
      request(app)
        .get(`/users/${user.id}/payment-methods`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;

          const { body } = res;
          expect(body).to.have.length(2);
          expect(body[0].id).to.be.equal(paymentMethod1.id);
          expect(body[0].service).to.be.equal(paymentMethod1.service);
          expect(body[0].token).to.be.equal(paymentMethod1.token);
          done();
        });
    });

    it('successfully get a user\'s paymentMethod and filters by service', (done) => {
      request(app)
        .get(`/users/${user.id}/payment-methods`)
        .query({
          filter: {
            service: 'paypal'
          }
        })
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          const { body } = res;

          expect(body).to.have.length(1);
          expect(body[0].id).to.be.equal(paymentMethod1.id);
          expect(body[0].service).to.be.equal(paymentMethod1.service);
          expect(body[0].token).to.be.equal(paymentMethod1.token);
          done();
        });
    });

  });
});

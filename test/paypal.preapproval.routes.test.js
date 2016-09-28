import _ from 'lodash';
import app from '../server/index';
import async from 'async';
import { expect } from 'chai';
import request from 'supertest';
import * as utils from '../test/utils';
import sinon from 'sinon';
import models from '../server/models';
import paypalMock from './mocks/paypal';
import paypalAdaptive from '../server/gateways/paypalAdaptive';

describe('paypal.preapproval.routes.test.js', () => {

  let application;
  let user;
  let user2;

  beforeEach(() => {
    const stub = sinon.stub(paypalAdaptive, 'preapproval');
    stub.yields(null, paypalMock.adaptive.preapproval);
  });

  afterEach(() => {
    paypalAdaptive.preapproval.restore();
  });

  beforeEach((done) => {
    async.auto({
      resetDB: (cb) => {
        utils.resetTestDB().asCallback(cb);
      },
      createUserA: ['resetDB', (cb) => {
        models.User.create(utils.data('user1'))
          .then(user => cb(null, user))
          .catch(cb);
      }],
      createUserB: ['resetDB', (cb) => {
        models.User.create(utils.data('user2'))
          .then(user => cb(null, user))
          .catch(cb);
      }]
    }, (e, results) => {
      expect(e).to.not.exist;
      application = results.resetDB;
      user = results.createUserA;
      user2 = results.createUserB;
      done();
    });
  });

  /**
   * Get the preapproval Key.
   */
  describe('#getPreapprovalKey', () => {

    it('should fail if not the logged-in user', (done) => {
      request(app)
        .get(`/users/${user.id}/paypal/preapproval`)
        .set('Authorization', `Bearer ${user2.jwt()}`)
        .expect(403)
        .end(done);
    });

    it('should get a preapproval key', (done) => {
      request(app)
        .get(`/users/${user.id}/paypal/preapproval`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('preapprovalKey', paypalMock.adaptive.preapproval.preapprovalKey);

          models.PaymentMethod
            .findAndCountAll({})
            .then((res) => {
              expect(res.count).to.equal(1);
              const paykey = res.rows[0];
              expect(paykey).to.have.property('service', 'paypal');
              expect(paykey).to.have.property('UserId', user.id);
              expect(paykey).to.have.property('token', paypalMock.adaptive.preapproval.preapprovalKey);
              done();
            })
            .catch(done);
        });
    });

    describe('Check existing paymentMethods', () => {

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      const beforePastDate = () => {
        const date = new Date();
        date.setDate(date.getDate() - 1); // yesterday

        const { completed } = paypalMock.adaptive.preapprovalDetails;
        const mock = _.extend(completed, {
          endingDate: date.toString()
        });

        const stub = sinon.stub(paypalAdaptive, 'preapprovalDetails');
        stub.yields(null, mock);
      };

      it('should delete if the date is past', () => {
        beforePastDate();

        const token = 'abc';
        const paymentMethod = {
          service: 'paypal',
          UserId: user.id,
          token
        };

        return models.PaymentMethod.create(paymentMethod)
          .tap(res => expect(res.token).to.equal(token))
          .then(() => request(app)
            .get(`/users/${user.id}/paypal/preapproval`)
            .set('Authorization', `Bearer ${user.jwt()}`)
            .expect(200))
          .then(() => models.PaymentMethod.findAndCountAll({where: {token} }))
          .tap(res => expect(res.count).to.equal(0));
      });

      const beforeNotApproved = () => {
        const mock = paypalMock.adaptive.preapprovalDetails.created;
        expect(mock.approved).to.be.equal('false');

        const stub = sinon.stub(paypalAdaptive, 'preapprovalDetails');
        stub.yields(null, paypalMock.adaptive.preapprovalDetails.created);
      };

      it('should delete if not approved yet', () => {
        beforeNotApproved();

        const token = 'def';
        const paymentMethod = {
          service: 'paypal',
          UserId: user.id,
          token
        };

        return models.PaymentMethod.create(paymentMethod)
          .tap(res => expect(res.token).to.equal(token))
          .then(() => request(app)
            .get(`/users/${user.id}/paypal/preapproval`)
            .set('Authorization', `Bearer ${user.jwt()}`)
            .expect(200))
          .then(() => models.PaymentMethod.findAndCountAll({where: {token} }))
          .tap(res => expect(res.count).to.equal(0));
      });
    });
  });

  /**
   * Confirm a preapproval.
   */
  describe('#confirmPreapproval', () => {

    const preapprovalkey = paypalMock.adaptive.preapproval.preapprovalKey;

    beforeEach((done) => {
      request(app)
        .get(`/users/${user.id}/paypal/preapproval`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(200)
        .end(done);
    });

    describe('Details from Paypal COMPLETED', () => {

      beforeEach(() => {
        const stub = sinon.stub(paypalAdaptive, 'preapprovalDetails');
        stub.yields(null, paypalMock.adaptive.preapprovalDetails.completed);
      });

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should fail if not the logged-in user', (done) => {
        request(app)
          .post(`/users/${user.id}/paypal/preapproval/${preapprovalkey}`)
          .set('Authorization', `Bearer ${user2.jwt()}`)
          .expect(403)
          .end(done);
      });

      it('should fail with an unknown preapproval key', (done) => {
        request(app)
          .post(`/users/${user.id}/paypal/preapproval/abc`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(404)
          .end(done);
      });

      it('should confirm the payment of a transaction', (done) => {
        const mock = paypalMock.adaptive.preapprovalDetails;
        request(app)
          .post(`/users/${user.id}/paypal/preapproval/${preapprovalkey}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body.token).to.equal(preapprovalkey);

            async.auto({
              checkPaymentMethod: (cb) => {
                models.PaymentMethod.findAndCountAll({where: {token: preapprovalkey} }).then((res) => {
                  expect(res.count).to.equal(1);
                  expect(res.rows[0].confirmedAt).not.to.be.null;
                  expect(res.rows[0].service).to.equal('paypal');
                  expect(res.rows[0].number).to.equal(mock.completed.senderEmail);
                  expect(res.rows[0].UserId).to.equal(user.id);
                  cb();
                });
              },
              checkActivity: (cb) => {
                models.Activity.findAndCountAll({where: {type: 'user.paymentMethod.created'} }).then((res) => {
                  expect(res.count).to.equal(1);
                  cb();
                });
              }
            }, done);

          });
      });

    });

    describe('Details from Paypal CREATED', () => {

      beforeEach(() => {
        const stub = sinon.stub(paypalAdaptive, 'preapprovalDetails');
        stub.yields(null, paypalMock.adaptive.preapprovalDetails.created);
      });

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should return an error if the preapproval is not completed', (done) => {
        request(app)
          .post(`/users/${user.id}/paypal/preapproval/${preapprovalkey}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(400)
          .end(done);
      });

    });

    describe('Details from Paypal ERROR', () => {

      beforeEach(() => {
        const mock = paypalMock.adaptive.preapprovalDetails.error;
        const stub = sinon.stub(paypalAdaptive, 'preapprovalDetails');
        stub.yields(mock.error, mock);
      });

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should return an error if paypal returns one', (done) => {
        request(app)
          .post(`/users/${user.id}/paypal/preapproval/${preapprovalkey}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(500)
          .end(done);
      });

    });

    describe('Preapproval details', () => {
      beforeEach(() => {
        const mock = paypalMock.adaptive.preapprovalDetails.created;
        const stub = sinon.stub(paypalAdaptive, 'preapprovalDetails');
        stub.yields(mock.error, mock);
      });

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should return the preapproval details', (done) => {
        request(app)
          .get(`/users/${user.id}/paypal/preapproval/${preapprovalkey}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(200)
          .end(done);
      });

      it('should not be able to check another user preapproval details', (done) => {
        request(app)
          .get(`/users/${user2.id}/paypal/preapproval/${preapprovalkey}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(403)
          .end(done);
      });
    });

    describe('PaymentMethods clean up', () => {
      it('should delete all other paymentMethods entries in the database to clean up', (done) => {
        request(app)
          .post(`/users/${user.id}/paypal/preapproval/${preapprovalkey}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(200)
          .end(e => {
            expect(e).to.not.exist;
            models.PaymentMethod.findAndCountAll({where: {token: preapprovalkey} })
            .then((res) => {
              expect(res.count).to.equal(1);
              expect(res.rows[0].confirmedAt).not.to.be.null;
              expect(res.rows[0].service).to.equal('paypal');
              expect(res.rows[0].UserId).to.equal(user.id);
              done();
            });
          });
      });
    });

  });

});

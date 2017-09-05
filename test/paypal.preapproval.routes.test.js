import Promise from 'bluebird';
import app from '../server/index';
import async from 'async';
import { expect } from 'chai';
import request from 'supertest';
import * as utils from '../test/utils';
import sinon from 'sinon';
import models from '../server/models';
import paypalMock from './mocks/paypal';
import paypalAdaptive from '../server/gateways/paypalAdaptive';

const application = utils.data('application');

describe('paypal.preapproval.routes.test.js', () => {

  let user, user2, sandbox;

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  beforeEach(() => {
    sinon.stub(paypalAdaptive, 'preapproval', 
      () => Promise.resolve(paypalMock.adaptive.preapproval));
  });

  afterEach(() => {
    paypalAdaptive.preapproval.restore();
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  beforeEach((done) => {
    async.auto({
      resetDB: (cb) => {
        utils.resetTestDB().asCallback(cb);
      },
      createUserA: ['resetDB', (cb) => {
        models.User.createUserWithCollective(utils.data('user1'))
          .then(user => cb(null, user))
          .catch(cb);
      }],
      createUserB: ['createUserA', (cb) => {
        models.User.createUserWithCollective(utils.data('user2'))
          .then(user => cb(null, user))
          .catch(cb);
      }]
    }, (e, results) => {
      expect(e).to.not.exist;
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
        .get(`/users/${user.id}/paypal/preapproval?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user2.jwt()}`)
        .expect(403)
        .end(done);
    });

    it('should get a preapproval key', (done) => {
      request(app)
        .get(`/users/${user.id}/paypal/preapproval?api_key=${application.api_key}`)
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
              expect(paykey).to.have.property('CreatedByUserId', user.id);
              expect(paykey).to.have.property('token', paypalMock.adaptive.preapproval.preapprovalKey);
              done();
            })
            .catch(done);
        });
    });
  });

  /**
   * Confirm a preapproval.
   */
  describe('#confirmPreapproval', () => {

    const preapprovalkey = paypalMock.adaptive.preapproval.preapprovalKey;

    beforeEach('get preapproval key', (done) => {
      request(app)
        .get(`/users/${user.id}/paypal/preapproval?api_key=${application.api_key}`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(200)
        .end(done);
    });

    describe('Details from Paypal COMPLETED', () => {

      beforeEach('stub paypalAdaptive', () => {
        sinon.stub(paypalAdaptive, 'preapprovalDetails',
          () => Promise.resolve(paypalMock.adaptive.preapprovalDetails.completed));
      });

      afterEach('restore paypalAdaptive', () => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should fail if not the logged-in user', (done) => {
        request(app)
          .post(`/users/${user.id}/paypal/preapproval/${preapprovalkey}?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user2.jwt()}`)
          .expect(403)
          .end(done);
      });

      it('should fail with an unknown preapproval key', (done) => {
        request(app)
          .post(`/users/${user.id}/paypal/preapproval/abc?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(404)
          .end(done);
      });

      it('should confirm the payment of a transaction', (done) => {
        const mock = paypalMock.adaptive.preapprovalDetails;
        request(app)
          .post(`/users/${user.id}/paypal/preapproval/${preapprovalkey}?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body.token).to.equal(preapprovalkey);

            models.PaymentMethod.findAndCountAll({ where: { token: preapprovalkey } })
            .then(res => {
              expect(res.count).to.equal(1);
              expect(res.rows[0].confirmedAt).not.to.be.null;
              expect(res.rows[0].service).to.equal('paypal');
              expect(res.rows[0].name).to.equal(mock.completed.senderEmail);
              expect(res.rows[0].CreatedByUserId).to.equal(user.id);
            })
            .then(() => models.Activity.findAndCountAll({ where: { type: 'user.paymentMethod.created' } }))
            .then(res => {
              expect(res.count).to.equal(1);
              done();
            });
          });
      });
    });

    describe('Details from Paypal CREATED', () => {

      beforeEach(() => {
        sinon.stub(paypalAdaptive, 'preapprovalDetails', 
          () => Promise.resolve(paypalMock.adaptive.preapprovalDetails.created));
      });

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should return an error if the preapproval is not completed', (done) => {
        request(app)
          .post(`/users/${user.id}/paypal/preapproval/${preapprovalkey}?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(400)
          .end(done);
      });

    });

    describe('Details from Paypal ERROR', () => {

      beforeEach(() => {
        sinon.stub(paypalAdaptive, 'preapprovalDetails', 
          () => Promise.reject(paypalMock.adaptive.preapprovalDetails.error));
      });

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should return an error if paypal returns one', (done) => {
        request(app)
          .post(`/users/${user.id}/paypal/preapproval/${preapprovalkey}?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(500)
          .end(done);
      });

    });

    describe('Preapproval details', () => {
      beforeEach(() => {
        sinon.stub(paypalAdaptive, 'preapprovalDetails',
          () => Promise.resolve(paypalMock.adaptive.preapprovalDetails.completed));
      });

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should return the preapproval details', (done) => {
        request(app)
          .get(`/users/${user.id}/paypal/preapproval/${preapprovalkey}?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(200)
          .end(done);
      });

      it('should not be able to check another user preapproval details', (done) => {
        request(app)
          .get(`/users/${user2.id}/paypal/preapproval/${preapprovalkey}?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(403)
          .end(done);
      });
    });

    describe('PaymentMethods clean up', () => {

      // create another dummy payment method for this user
      beforeEach(() => {
        return models.PaymentMethod.create({
          service: 'paypal',
          CreatedByUserId: user.id,
          CollectiveId: user.CollectiveId,
          token: 'blah'
        })
      });

      beforeEach(() => {
        sinon.stub(paypalAdaptive, 'preapprovalDetails',
          () => Promise.resolve(paypalMock.adaptive.preapprovalDetails.completed));
      });

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should delete all other paymentMethods entries in the database to clean up', (done) => {
        request(app)
          .post(`/users/${user.id}/paypal/preapproval/${preapprovalkey}?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(200)
          .end(e => {
            expect(e).to.not.exist;
            models.PaymentMethod.findAndCountAll({where: { token: preapprovalkey } })
            .then((res) => {
              expect(res.count).to.equal(1);
              expect(res.rows[0].confirmedAt).not.to.be.null;
              expect(res.rows[0].service).to.equal('paypal');
              expect(res.rows[0].CreatedByUserId).to.equal(user.id);
              done();
            });
          });
      });
    });

  });

});

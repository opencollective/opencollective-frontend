import Promise from 'bluebird';
import request from 'supertest';
import sinon from 'sinon';
import { expect } from 'chai';

import * as utils from '../../utils';
import app from '../../../server/index';
import models from '../../../server/models';
import paypalMock from '../../mocks/paypal';
import paypalAdaptive from '../../../server/paymentProviders/paypal/adaptiveGateway';

const application = utils.data('application');

describe('server/routes/paypal.preapproval', () => {
  let user, user2;

  beforeEach(() => {
    sinon.stub(paypalAdaptive, 'preapproval').callsFake(() => Promise.resolve(paypalMock.adaptive.preapproval));
  });

  afterEach(() => {
    paypalAdaptive.preapproval.restore();
  });

  beforeEach(async () => {
    await utils.resetTestDB();
    user = await models.User.createUserWithCollective(utils.data('user1'));
    user2 = await models.User.createUserWithCollective(utils.data('user2'));
  });

  /**
   * Get the preapproval Key.
   */
  describe('#getPreapprovalKey', () => {
    it('should fail if not the logged-in user', done => {
      request(app)
        .get(
          `/connected-accounts/paypal/oauthUrl?api_key=${application.api_key}&CollectiveId=${user.CollectiveId}&redirect=https://`,
        )
        .set('Authorization', `Bearer ${user2.jwt()}`)
        .expect(401)
        .end(done);
    });

    it('should get a preapproval key', done => {
      request(app)
        .get(
          `/connected-accounts/paypal/oauthUrl?api_key=${application.api_key}&CollectiveId=${
            user.CollectiveId
          }&redirect=${encodeURIComponent('https://localhost:3030/paypal/redirect')}`,
        )
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body.redirectUrl).to.contain('&preapprovalkey=PA-');
          models.PaymentMethod.findAndCountAll({ where: { service: 'paypal' } })
            .then(res => {
              expect(res.count).to.equal(1);
              const paykey = res.rows[0];
              expect(paykey).to.have.property('service', 'paypal');
              expect(paykey).to.have.property('CreatedByUserId', user.id);
              expect(paykey).to.have.property('CollectiveId', user.CollectiveId);
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

    beforeEach('get preapproval key', done => {
      request(app)
        .get(
          `/connected-accounts/paypal/oauthUrl?api_key=${application.api_key}&CollectiveId=${
            user.CollectiveId
          }&redirect=${encodeURIComponent('https://localhost:3030/paypal/redirect')}`,
        )
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(200)
        .end(done);
    });

    describe('Details from Paypal COMPLETED', () => {
      beforeEach('stub paypalAdaptive', () => {
        sinon
          .stub(paypalAdaptive, 'preapprovalDetails')
          .callsFake(() => Promise.resolve(paypalMock.adaptive.preapprovalDetails.completed));
      });

      afterEach('restore paypalAdaptive', () => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should fail with an unknown preapproval key', done => {
        request(app)
          .get('/connected-accounts/paypal/callback?preapprovalKey=abc&paypalApprovalStatus=success')
          .set('Authorization', `Bearer ${user.jwt()}`)
          .end((e, res) => {
            const error = res.body.error;
            expect(error.code).to.equal(400);
            expect(error.message).to.equal('No paymentMethod found with this preapproval key: abc');
            done();
          });
      });

      it('should confirm the payment of a transaction', done => {
        const mock = paypalMock.adaptive.preapprovalDetails;
        request(app)
          .get(`/connected-accounts/paypal/callback?preapprovalKey=${preapprovalkey}&paypalApprovalStatus=success`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(302)
          .end((e, res) => {
            expect(res.headers.location).to.include('paypal/redirect?status=success&service=paypal');

            models.PaymentMethod.findAndCountAll({
              where: { token: preapprovalkey },
            })
              .then(res => {
                expect(res.count).to.equal(1);
                expect(res.rows[0].confirmedAt).not.to.be.null;
                expect(res.rows[0].service).to.equal('paypal');
                expect(res.rows[0].name).to.equal(mock.completed.senderEmail);
                expect(res.rows[0].CreatedByUserId).to.equal(user.id);
              })
              .then(() =>
                models.Activity.findAndCountAll({
                  where: { type: 'user.paymentMethod.created' },
                }),
              )
              .then(res => {
                expect(res.count).to.equal(1);
                done();
              });
          });
      });
    });

    describe('Details from Paypal CREATED', () => {
      beforeEach(() => {
        sinon
          .stub(paypalAdaptive, 'preapprovalDetails')
          .callsFake(() => Promise.resolve(paypalMock.adaptive.preapprovalDetails.created));
      });

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should return an error if the preapproval is not completed', done => {
        request(app)
          .get(`/connected-accounts/paypal/callback?preapprovalKey=${preapprovalkey}&paypalApprovalStatus=success`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .end((e, res) => {
            expect(res.headers.location).to.contain(
              'paypal/redirect?status=error&service=paypal&error=Error%20while%20contacting%20PayPal&errorMessage=This%20preapprovalkey%20is%20not%20approved%20yet',
            );
            done();
          });
      });
    });

    describe('Details from Paypal ERROR', () => {
      beforeEach(() => {
        sinon
          .stub(paypalAdaptive, 'preapprovalDetails')
          .callsFake(() => Promise.reject(paypalMock.adaptive.preapprovalDetails.error));
      });

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should return an error if paypal returns one', done => {
        request(app)
          .get(`/connected-accounts/paypal/callback?preapprovalKey=${preapprovalkey}&paypalApprovalStatus=success`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .end((e, res) => {
            expect(res.headers.location).to.contain(
              '/paypal/redirect?status=error&service=paypal&error=Error%20while%20contacting%20PayPal',
            );
            done();
          });
      });
    });

    describe('Preapproval details', () => {
      beforeEach(() => {
        sinon
          .stub(paypalAdaptive, 'preapprovalDetails')
          .callsFake(() => Promise.resolve(paypalMock.adaptive.preapprovalDetails.completed));
      });

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should return the preapproval details', done => {
        request(app)
          .get(`/connected-accounts/paypal/verify?preapprovalKey=${preapprovalkey}&api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(200)
          .end((e, res) => {
            expect(res.body.data.details.approved).to.equal('true');
            done();
          });
      });

      it('should not be able to check another user preapproval details', done => {
        request(app)
          .get(`/connected-accounts/paypal/verify?preapprovalKey=${preapprovalkey}&api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user2.jwt()}`)
          .expect(401)
          .end(done);
      });
    });

    describe('PaymentMethods clean up', () => {
      // create another dummy payment method for this user
      beforeEach(() => {
        return models.PaymentMethod.create({
          service: 'paypal',
          type: 'adaptive',
          CreatedByUserId: user.id,
          CollectiveId: user.CollectiveId,
          token: 'blah',
        });
      });

      beforeEach(() => {
        sinon
          .stub(paypalAdaptive, 'preapprovalDetails')
          .callsFake(() => Promise.resolve(paypalMock.adaptive.preapprovalDetails.completed));
      });

      afterEach(() => {
        paypalAdaptive.preapprovalDetails.restore();
      });

      it('should delete all other paymentMethods entries in the database to clean up', done => {
        request(app)
          .get(`/connected-accounts/paypal/callback?preapprovalKey=${preapprovalkey}&paypalApprovalStatus=success`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(302)
          .end(e => {
            expect(e).to.not.exist;
            models.PaymentMethod.findAndCountAll({
              where: { token: preapprovalkey },
            }).then(res => {
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

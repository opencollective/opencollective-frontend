import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import * as utils from '../test/utils';
import models from '../server/models';

const application = utils.data('application');
const userData = utils.data('user1');
const collectiveData = utils.data('collective1');

describe('homepage.routes.test.js', () => {
  let user, collective, paymentMethod;

  beforeEach(done => {
    setTimeout(done, 1000);
  });
  beforeEach(() => utils.resetTestDB());
  beforeEach(done => {
    setTimeout(done, 1000);
  });

  beforeEach(() =>
    models.User.createUserWithCollective(userData).tap(u => (user = u)));
  beforeEach(() =>
    models.Collective.create(collectiveData)
      .tap(g => {
        collective = g;
        return collective.addHost(user.collective);
      })
      .then(() =>
        models.PaymentMethod.create({
          CreatedByUserId: user.id,
          CollectiveId: user.CollectiveId,
          service: 'stripe',
          token: 'tok_123456781234567812345678',
        }),
      )
      .tap(p => (paymentMethod = p))
      .then(() => {
        return models.Transaction.createDoubleEntry({
          amount: 100000,
          netAmountInCollectiveCurrency: 100000,
          type: 'CREDIT',
          PaymentMethodId: paymentMethod.id,
          FromCollectiveId: user.CollectiveId,
          CollectiveId: collective.id,
          CreatedByUserId: user.id,
          HostCollectiveId: user.id,
        });
      }));

  /**
   * Get.
   */
  describe('#get /homepage', () => {
    it('gets the homepage data', () =>
      request(app)
        .get(`/homepage?api_key=${application.api_key}`)
        .expect(200)
        .then(res => {
          const { body } = res;
          expect(body.stats).to.have.property('totalCollectives');
          expect(body.collectives).to.have.property('opensource');
          expect(body.collectives).to.have.property('meetup');
          expect(body.collectives.opensource.length).to.equal(1);
          expect(body.collectives.opensource[0].name).to.equal(
            collectiveData.name,
          );
        }));
  });
});

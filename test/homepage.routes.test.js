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

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.create(userData).tap(u => user = u));
  beforeEach(() =>
    models.Collective
      .create(collectiveData).tap(g => {
        collective = g;
        return collective.addUserWithRole(user, 'HOST');
      })
      .then(() => models.PaymentMethod.create({UserId: user.id}))
      .tap(p => paymentMethod = p)
      .then(() => {
        return models.Transaction.create({
          amount:100000,
          PaymentMethodId: paymentMethod.id,
          CollectiveId: collective.id,
          UserId: user.id,
          HostId: user.id
        })
      })
  );

  /**
   * Get.
   */
  describe('#get /homepage', () => {

    it('gets the homepage data', (done) => {
      request(app)
        .get(`/homepage?api_key=${application.api_key}`)
        .expect(200)
        .end((err, res) => {
          const { body } = res;
          expect(body.stats).to.have.property('totalCollectives');
          expect(body.collectives).to.have.property('opensource');
          expect(body.collectives).to.have.property('meetup');
          expect(body.collectives.opensource.length).to.equal(1);
          expect(body.collectives.opensource[0].name).to.equal(collectiveData.name);
          done();
        })
    });

  });

});

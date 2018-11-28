import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest-as-promised';
import * as utils from '../test/utils';
import models from '../server/models';

const collectiveData1 = utils.data('collective1'); // `open source` tag
const collectiveData2 = utils.data('collective2'); // `meetup` tag
const paymentMethodData1 = utils.data('paymentMethod1');
const transactionsData = utils.data('transactions1').transactions;
const application = utils.data('application');

describe('discover', () => {
  let user, collective1, collective2, paymentMethod1;

  beforeEach(() => utils.resetTestDB());
  beforeEach(() => models.PaymentMethod.create(paymentMethodData1).tap(pm => (paymentMethod1 = pm)));
  beforeEach(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user = u)));
  beforeEach(() => models.Collective.create(collectiveData1).tap(g => (collective1 = g)));
  beforeEach(() => models.Collective.create(collectiveData2).tap(g => (collective2 = g)));
  beforeEach(done => {
    transactionsData[8].CreatedByUserId = user.id;
    transactionsData[8].HostCollectiveId = user.CollectiveId;
    transactionsData[8].FromCollectiveId = user.CollectiveId;
    transactionsData[8].CollectiveId = collective1.id;
    transactionsData[8].PaymentMethodId = paymentMethod1.id;
    models.Transaction.createDoubleEntry(transactionsData[8])
      .then(() => done())
      .catch(done);
  });
  beforeEach(done => {
    transactionsData[8].CollectiveId = collective2.id;
    transactionsData[8].PaymentMethodId = paymentMethod1.id;
    models.Transaction.createDoubleEntry(transactionsData[8])
      .then(() => done())
      .catch(done);
  });

  /**
   * Get.
   */
  describe('#get /discover', () => {
    it('/discover - No params defaults to: /discover?show=all&sort=most%20popular', done => {
      request(app)
        .get(`/discover?api_key=${application.api_key}`)
        .expect(200)
        .end((err, res) => {
          const { body } = res;
          const ids = body.collectives.map(c => c.id);
          expect(body.show).equal('all');
          expect(body.sort).equal('most popular');
          expect(body.collectives).to.be.Array;
          expect(body.collectives.length).equal(2);
          expect(body.total).equal(2);
          expect(ids.indexOf(collective1.id)).not.equal(-1);
          expect(ids.indexOf(collective2.id)).not.equal(-1);
          expect(ids[0]).equal(collective1.id); // Newest (created second)
          expect(ids[1]).equal(collective2.id);
          done();
        });
    });

    it('/discover?show=open source', done => {
      request(app)
        .get(`/discover?api_key=${application.api_key}&show=open%20source`)
        .expect(200)
        .end((err, res) => {
          const { body } = res;
          const ids = body.collectives.map(c => c.id);
          expect(body.show).equal('open source');
          expect(body.sort).equal('most popular');
          expect(body.collectives).to.be.Array;
          expect(body.collectives.length).equal(1);
          expect(body.total).equal(1);
          expect(ids.indexOf(collective1.id)).not.equal(-1);
          expect(ids.indexOf(collective2.id)).equal(-1);
          expect(ids[0]).equal(collective1.id);
          done();
        });
    });

    it('/discover?show=meetup', done => {
      request(app)
        .get(`/discover?api_key=${application.api_key}&show=meetup`)
        .expect(200)
        .end((err, res) => {
          const { body } = res;
          const ids = body.collectives.map(c => c.id);
          expect(body.show).equal('meetup');
          expect(body.sort).equal('most popular');
          expect(body.collectives).to.be.Array;
          expect(body.collectives.length).equal(1);
          expect(body.total).equal(1);
          expect(ids.indexOf(collective1.id)).equal(-1);
          expect(ids.indexOf(collective2.id)).not.equal(-1);
          expect(ids[0]).equal(collective2.id);
          done();
        });
    });

    it('/discover?show=undefined', done => {
      request(app)
        .get(`/discover?api_key=${application.api_key}&show=undefined`)
        .expect(200)
        .end((err, res) => {
          const { body } = res;
          expect(body.show).equal('undefined');
          expect(body.sort).equal('most popular');
          expect(body.collectives).to.be.Array;
          expect(body.collectives.length).equal(0);
          expect(body.total).equal(0);
          done();
        });
    });

    it('/discover?show=all&sort=newest', done => {
      request(app)
        .get(`/discover?api_key=${application.api_key}&show=all&sort=newest`)
        .expect(200)
        .end((err, res) => {
          const { body } = res;
          const ids = body.collectives.map(c => c.id);
          expect(body.show).equal('all');
          expect(body.sort).equal('newest');
          expect(body.collectives).to.be.Array;
          expect(body.collectives.length).equal(2);
          expect(body.total).equal(2);
          expect(ids.indexOf(collective1.id)).not.equal(-1);
          expect(ids.indexOf(collective2.id)).not.equal(-1);
          expect(ids[0]).equal(collective2.id); // Newest (created last)
          expect(ids[1]).equal(collective1.id);
          done();
        });
    });

    it('/discover?show=all&sort=undefined', done => {
      request(app)
        .get(`/discover?api_key=${application.api_key}&show=all&sort=undefined`)
        .expect(200)
        .end((err, res) => {
          const { body } = res;
          const ids = body.collectives.map(c => c.id);
          expect(body.show).equal('all');
          expect(body.sort).equal('most popular');
          expect(body.collectives).to.be.Array;
          expect(body.collectives.length).equal(2);
          expect(body.total).equal(2);
          expect(ids.indexOf(collective1.id)).not.equal(-1);
          expect(ids.indexOf(collective2.id)).not.equal(-1);
          expect(ids[0]).equal(collective1.id); // Most popular
          expect(ids[1]).equal(collective2.id);
          done();
        });
    });
  });
});

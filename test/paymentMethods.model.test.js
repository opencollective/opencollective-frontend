import config from 'config';
import sinon from 'sinon';
import { expect } from 'chai';
import * as utils from '../test/utils';
import models from '../server/models';
import nock from 'nock';

nock('http://data.fixer.io')
  .get(/.*/)
  .query({ access_key: config.fixer.accessKey, base: 'EUR', symbols: 'USD' })
  .reply(200, { base: 'EUR', date: '2017-09-01', rates: { USD: 1.192 } });

describe('paymentmethod.model.test.js', () => {
  let timer, user, collective, organization, paymentMethod;
  before(async () => {
    await utils.resetTestDB();
    timer = sinon.useFakeTimers(new Date('2017-09-01 00:00:00').getTime());
  });
  after(() => timer.restore());

  describe('validation', () => {
    it('validates the token for Stripe', done => {
      models.PaymentMethod.create({
        service: 'stripe',
        type: 'creditcard',
        token: 'invalid token',
      }).catch(e => {
        expect(e.message).to.equal('Invalid Stripe token invalid token');
        done();
      });
    });
  });

  describe('instance methods', () => {
    before('create a user', () =>
      models.User.createUserWithCollective({ name: 'Xavier' }).then(
        u => (user = u),
      ),
    );
    before('create a collective', () =>
      models.Collective.create({
        name: 'BrusselsTogether',
        currency: 'EUR',
      }).then(c => (collective = c)),
    );
    before('create an organization', () =>
      models.Collective.create({ name: 'pubnub', currency: 'USD' }).then(
        o => (organization = o),
      ),
    );
    before('create a payment method', () =>
      models.PaymentMethod.create({
        name: '4242',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: organization.id,
        monthlyLimitPerMember: 10000,
      }).then(pm => (paymentMethod = pm)),
    );
    before('create many transactions', () =>
      models.Transaction.createMany(
        [
          { netAmountInCollectiveCurrency: -500 },
          { netAmountInCollectiveCurrency: -200 },
          { netAmountInCollectiveCurrency: -1000 },
        ],
        {
          CreatedByUserId: user.id,
          FromCollectiveId: collective.id,
          CollectiveId: organization.id,
          PaymentMethodId: paymentMethod.id,
          currency: collective.currency,
          HostCollectiveId: collective.id,
          type: 'DEBIT',
        },
      ),
    );

    it("computes the balance in the currency of the payment method's collective", async () => {
      const balance = await paymentMethod.getBalanceForUser(user);
      expect(balance.currency).to.equal(organization.currency);
      expect(balance.amount).to.equal(7974); // $100 - (€5 + €2 + €10)
    });
  });
});

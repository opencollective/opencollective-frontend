import { expect } from 'chai';
import * as utils from '../../utils';
import models from '../../../server/models';
import { randEmail } from '../../stores';

describe('server/models/Order', () => {
  let user, collective, tier, order;
  before(() => utils.resetTestDB());
  before('create a user', () =>
    models.User.createUserWithCollective({
      email: randEmail(),
      name: 'Xavier',
    }).then(u => (user = u)),
  );
  before('create a collective', () => models.Collective.create({ name: 'Webpack' }).then(c => (collective = c)));
  before('create a tier', () => models.Tier.create({ name: 'backer', amount: 0 }).then(t => (tier = t)));
  before('create an order', () =>
    models.Order.create({
      CreatedByUserId: user.id,
      FromCollectiveId: user.CollectiveId,
      CollectiveId: collective.id,
      TierId: tier.id,
      totalAmount: 1000,
      currency: 'USD',
    }).then(o => (order = o)),
  );

  it('populates the foreign keys', done => {
    order.populate().then(order => {
      expect(order.createdByUser.id).to.equal(user.id);
      expect(order.fromCollective.id).to.equal(user.CollectiveId);
      expect(order.collective.id).to.equal(collective.id);
      expect(order.tier.id).to.equal(tier.id);
      expect(order.paymentMethod).to.not.exist;
      done();
    });
  });
});

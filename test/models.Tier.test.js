import { expect } from 'chai';
import models from '../server/models';
import { randEmail, newCollectiveWithHost } from './stores';

describe('create', () => {
  let collective, user, validTierParams;

  before(async () => {
    user = await models.User.createUserWithCollective({ email: randEmail(), name: 'TierTester' });
    collective = (await newCollectiveWithHost()).collective;
    validTierParams = {
      CreatedByUserId: user.id,
      CollectiveId: collective.id,
      name: 'A valid tier name',
      amount: 4200,
    };
  });

  describe('slug', () => {
    it('Use tier name if omitted', async () => {
      const tier = await models.Tier.create(validTierParams);
      expect(tier.slug).to.eq('a-valid-tier-name');
    });

    it('Fallback gracefully if the slug cannot be generated', async () => {
      const tier = await models.Tier.create({ ...validTierParams, name: '😵️' });
      expect(tier.slug).to.eq('tier');
    });
  });
});

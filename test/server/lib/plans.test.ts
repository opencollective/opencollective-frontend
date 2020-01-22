import { expect } from 'chai';

import * as utils from '../../utils';
import { fakeCollective, fakeUser, fakeTier, multiple } from '../../test-helpers/fake-data';
import models from '../../../server/models';
import { PLANS_COLLECTIVE_SLUG } from '../../../server/constants/plans';
import { subscribeOrUpgradePlan, validatePlanRequest } from '../../../server/lib/plans';

describe('server/lib/plans', () => {
  let collective, opencollective, user, order;

  beforeEach(utils.resetTestDB);
  beforeEach(async () => {
    user = await fakeUser();
    collective = await fakeCollective({ isHostAccount: true });
    opencollective = await fakeCollective({
      slug: PLANS_COLLECTIVE_SLUG,
    });
    const tier = await fakeTier({
      CollectiveId: opencollective.id,
      slug: 'small-host-plan',
      data: {
        hostedCollectivesLimit: 1,
      },
    });
    order = await models.Order.create({
      CreatedByUserId: user.id,
      FromCollectiveId: collective.id,
      CollectiveId: opencollective.id,
      totalAmount: 1000,
      currency: 'EUR',
      TierId: tier.id,
    });
  });

  describe('subscribeOrUpgradePlan', () => {
    it('should ignore if it is not an order for opencollective', async () => {
      const tier = await fakeTier({
        slug: 'small-host-plan',
      });
      const othercollective = await fakeCollective();
      const otherorder = await models.Order.create({
        CreatedByUserId: user.id,
        FromCollectiveId: collective.id,
        CollectiveId: othercollective.id,
        totalAmount: 1000,
        currency: 'EUR',
        TierId: tier.id,
      });

      await subscribeOrUpgradePlan(otherorder);

      await collective.reload();
      expect(collective.plan).to.equal(null);
    });

    it('should ignore if it is not a tier plan', async () => {
      const tier = await fakeTier({
        slug: 'tshirt',
      });
      const otherorder = await models.Order.create({
        CreatedByUserId: user.id,
        FromCollectiveId: collective.id,
        CollectiveId: opencollective.id,
        totalAmount: 1000,
        currency: 'EUR',
        TierId: tier.id,
      });

      await subscribeOrUpgradePlan(otherorder);

      await collective.reload();
      expect(collective.plan).to.equal(null);
    });

    it('should update plan when hiring the first time', async () => {
      await subscribeOrUpgradePlan(order);

      await collective.reload();
      expect(collective.plan).to.equal('small-host-plan');
    });

    it('should upgrade plan to unlock features', async () => {
      await subscribeOrUpgradePlan(order);

      const tier = await fakeTier({
        slug: 'medium-host-plan',
      });
      const mediumOrder = await models.Order.create({
        CreatedByUserId: user.id,
        FromCollectiveId: collective.id,
        CollectiveId: opencollective.id,
        totalAmount: 1000,
        currency: 'EUR',
        TierId: tier.id,
      });
      await subscribeOrUpgradePlan(mediumOrder);

      await collective.reload();
      expect(collective.plan).to.equal('medium-host-plan');
    });

    it("shouldn't downgrade existing plan", async () => {
      const tier = await fakeTier({
        slug: 'medium-host-plan',
      });
      const mediumOrder = await models.Order.create({
        CreatedByUserId: user.id,
        FromCollectiveId: collective.id,
        CollectiveId: opencollective.id,
        totalAmount: 1000,
        currency: 'EUR',
        TierId: tier.id,
      });
      await subscribeOrUpgradePlan(mediumOrder);
      await subscribeOrUpgradePlan(order);

      await collective.reload();
      expect(collective.plan).to.equal('medium-host-plan');
    });
  });

  describe('validatePlanRequest', () => {
    it('should return when hiring a plan matches the currently hosted collectives number', async () => {
      await fakeCollective({
        HostCollectiveId: collective.id,
      });

      await validatePlanRequest(order);
    });

    it('should throw when hiring a plan that has inferior hostedCollectivesLimit than currently hosted', async () => {
      await multiple(fakeCollective, 2, {
        HostCollectiveId: collective.id,
      });

      try {
        await validatePlanRequest(order);
        throw new Error("Didn't throw expected error!");
      } catch (e) {
        expect(e.message).to.contain('Requested plan limits is inferior to the current hosted collectives number');
      }
    });
  });
});

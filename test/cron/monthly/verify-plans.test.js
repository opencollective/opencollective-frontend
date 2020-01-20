import { expect } from 'chai';
import { map } from 'lodash/fp';

import { fakeCollective, fakeTier, multiple } from '../../test-helpers/fake-data';
import * as utils from '../../utils';
import models from '../../../server/models';
import orderStatus from '../../../server/constants/order_status';
import plans, { PLANS_COLLECTIVE_SLUG } from '../../../server/constants/plans';
import { run as verifyPlans } from '../../../cron/monthly/verify-plans';

const arrayToJSON = map(a => a.toJSON());

const assertCollectionIsUnchanged = async col => {
  const before = arrayToJSON(col);
  const now = arrayToJSON(await Promise.all(col.map(doc => doc.reload())));

  before.forEach((b, i) => {
    expect(b).to.deep.equal(now[i]);
  });
};

describe('cron/monthly/verify-plans.js', () => {
  let opencollective, otherCollectives;
  beforeEach(async () => {
    await utils.resetTestDB();
    // Adds noise
    otherCollectives = await multiple(fakeCollective, 5);
    await Promise.all(otherCollectives.map(c => c.reload()));
    opencollective = await fakeCollective({ slug: PLANS_COLLECTIVE_SLUG });
  });

  const createPlan = async (collective, planSlug, orderOptions = {}) => {
    const tier = await fakeTier({ slug: planSlug, CollectiveId: opencollective.id });
    return await models.Order.create({
      FromCollectiveId: collective.id,
      CollectiveId: opencollective.id,
      totalAmount: 1000,
      currency: 'EUR',
      TierId: tier.id,
      ...orderOptions,
    });
  };

  it('should ignore if Collective uses legacy plan', async () => {
    const collective = await fakeCollective({ plan: 'legacy-small' });
    await createPlan(collective, plans.small, { status: orderStatus.CANCELLED });

    await verifyPlans();

    await assertCollectionIsUnchanged(otherCollectives);
    await collective.reload();
    expect(collective.plan).to.equal('legacy-small');
  });

  it('should set plan to null if Collective cancelled its subscription', async () => {
    const collective = await fakeCollective({ plan: 'small-host-plan' });
    await createPlan(collective, 'small-host-plan', { status: orderStatus.CANCELLED });

    await verifyPlans();

    await assertCollectionIsUnchanged(otherCollectives);
    await collective.reload();
    expect(collective.plan).to.be.null;
  });

  it('should downgrade plan if Collective has hired another subscription', async () => {
    const collective = await fakeCollective({ plan: 'medium-host-plan' });
    await createPlan(collective, 'small-host-plan', { status: orderStatus.ACTIVE });

    await verifyPlans();

    await assertCollectionIsUnchanged(otherCollectives);
    await collective.reload();
    expect(collective.plan).to.equal('small-host-plan');
  });
});

import { expect } from 'chai';
import { SequelizeValidationError, ValidationError } from 'sequelize';
import { fakeUser } from '../../test-helpers/fake-data';
import models from '../../../server/models';
import { PayoutMethodTypes } from '../../../server/models/PayoutMethod';
import { randEmail } from '../../stores';

describe('server/models/PayoutMethod', () => {
  describe('validate data', () => {
    describe('for PayPal', () => {
      it('check email', async () => {
        const user = await fakeUser();
        const baseData = { CollectiveId: user.collective.id, CreatedByUserId: user.id, type: PayoutMethodTypes.PAYPAL };

        // Invalid
        const promise = models.PayoutMethod.create({ ...baseData, data: { email: 'Nope' } });
        await expect(promise).to.be.rejectedWith(SequelizeValidationError, 'Invalid PayPal email address');

        // Valid
        const pm = await models.PayoutMethod.create({ ...baseData, data: { email: randEmail() } });
        expect(pm).to.exist;
      });

      it('make sure only allowed fields are set', async () => {
        const user = await fakeUser();
        const baseData = { CollectiveId: user.collective.id, CreatedByUserId: user.id, type: PayoutMethodTypes.PAYPAL };
        const promise = models.PayoutMethod.create({ ...baseData, data: { email: randEmail(), hello: true } });
        await expect(promise).to.be.rejectedWith(
          ValidationError,
          'Data for this payout method contains too much information',
        );
      });
    });

    describe('for "other"', () => {
      it('only allows content', async () => {
        const user = await fakeUser();
        const baseData = { CollectiveId: user.collective.id, CreatedByUserId: user.id, type: PayoutMethodTypes.OTHER };

        // Invalid
        const promise = models.PayoutMethod.create({ ...baseData, data: { content: 'Yep', nope: 'maybe' } });
        await expect(promise).to.be.rejectedWith(
          ValidationError,
          'Data for this payout method contains too much information',
        );

        // Valid
        const pm = await models.PayoutMethod.create({ ...baseData, data: { content: 'Yep' } });
        expect(pm).to.exist;
      });
    });
  });
});

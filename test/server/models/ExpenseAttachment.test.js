import { expect } from 'chai';
import { fakeExpense, fakeUser } from '../../test-helpers/fake-data';
import models from '../../../server/models';
import { randUrl } from '../../stores';

describe('test/server/models/ExpenseAttachments', () => {
  describe('createFromData', () => {
    it('Filters out the bad fields', async () => {
      const expense = await fakeExpense();
      const user = await fakeUser();
      const data = {
        url: randUrl(),
        amount: 1500,
        incurredAt: new Date('2000-01-01T00:00:00'),
        deletedAt: new Date('2000-01-01T00:00:00'),
      };

      const attachment = await models.ExpenseAttachment.createFromData(data, user, expense);
      expect(attachment.url).to.equal(data.url);
      expect(attachment.amount).to.equal(data.amount);
      expect(attachment.incurredAt.getTime()).to.equal(data.incurredAt.getTime());
      expect(attachment.deletedAt).to.be.null;
    });
  });
});

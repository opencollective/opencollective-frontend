import { expect } from 'chai';
import { pick } from 'lodash';
import { fakeExpense, fakeCollective, fakeUser } from '../../test-helpers/fake-data';
import models from '../../../server/models';

describe('test/server/models/Expense', () => {
  describe('Create', () => {
    it('creates a valid expense', async () => {
      const user = await fakeUser();
      const expenseData = {
        description: 'A valid expense',
        FromCollectiveId: user.CollectiveId,
        CollectiveId: (await fakeCollective()).id,
        type: 'INVOICE',
        amount: 4200,
        currency: 'EUR',
        UserId: user.id,
        lastEditedById: user.id,
        incurredAt: new Date(),
        invoiceInfo: 'This will be printed on your invoice',
      };

      const expense = await models.Expense.create(expenseData);
      expect(pick(expense.dataValues, Object.keys(expenseData))).to.deep.eq(expenseData);
    });
  });

  describe('Delete', () => {
    it('Deleting an expense deletes its attachments', async () => {
      const expense = await fakeExpense();
      await expense.destroy();
      for (const attachment of expense.attachments) {
        await attachment.reload({ paranoid: false });
        expect(attachment.deletedAt).to.not.be.null;
      }
    });
  });
});

import { expect } from 'chai';
import { fakeExpense } from '../../test-helpers/fake-data';

describe('test/server/models/Expense', () => {
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

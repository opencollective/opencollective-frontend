import { expect } from 'chai';
import { graphqlQueryV2 } from '../../../../utils';
import { fakeCollective, fakeUser } from '../../../../test-helpers/fake-data';
import { randEmail } from '../../../../stores';

const createExpenseMutation = `
mutation createExpense($expense: ExpenseCreate!, $account: AccountInput!) {
  createExpense(expense: $expense, account: $account) {
    id
    legacyId
    invoiceInfo
  }
}`;

describe('server/graphql/v2/mutation/ExpenseMutations', () => {
  describe('createExpense', () => {
    it('creates the expense with the linked attachments', async () => {
      const user = await fakeUser();
      const collective = await fakeCollective();
      const expenseData = {
        description: 'A valid expense',
        type: 'INVOICE',
        invoiceInfo: 'This will be printed on your invoice',
        fromAccount: { legacyId: user.CollectiveId },
        payoutMethod: { type: 'PAYPAL', data: { email: randEmail() } },
        attachments: [{ description: 'A first attachment', amount: 4200 }],
      };

      const result = await graphqlQueryV2(
        createExpenseMutation,
        { expense: expenseData, account: { legacyId: collective.id } },
        user,
      );

      expect(result.errors).to.not.exist;
      expect(result.data).to.exist;
      expect(result.data.createExpense).to.exist;

      const createdExpense = result.data.createExpense;
      expect(createdExpense.invoiceInfo).to.eq(expenseData.invoiceInfo);
    });
  });
});

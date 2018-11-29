import { expect } from 'chai';
import { When } from 'cucumber';

import * as utils from '../../../utils';

When('{string} expenses {string} for {string} to {string} via {string}', async function(
  userName,
  value,
  description,
  collectiveName,
  payoutMethod,
) {
  const [amount, currency] = value.split(' ');
  const user = this.getValue(`${userName}-user`);
  const collective = this.getValue(collectiveName);
  const expense = {
    amount,
    currency,
    description,
    payoutMethod: payoutMethod.toLowerCase(),
    collective: { id: collective.id },
  };
  const query = `mutation createExpense($expense: ExpenseInputType!) {
      createExpense(expense: $expense) { id, status } }`;
  const result = await utils.graphqlQuery(query, { expense }, user);
  expect(result.errors).to.not.exist;
  this.addValue(`expense-${description}`, result.data.createExpense);
});

When('expense for {string} is approved by {string}', async function(description, collectiveName) {
  const hostAdmin = this.getValue(`${collectiveName}-host-admin`);
  const expense = this.getValue(`expense-${description}`);
  const query = 'mutation approveExpense($id: Int!) { approveExpense(id: $id) { id } }';
  const result = await utils.graphqlQuery(query, expense, hostAdmin);
  expect(result.errors).to.not.exist;
});

When('expense for {string} is paid by {string} with {string} fee', async function(description, collectiveName, fee) {
  const hostAdmin = this.getValue(`${collectiveName}-host-admin`);
  const query = 'mutation payExpense($id: Int!) { payExpense(id: $id) { id } }';
  const expense = this.getValue(`expense-${description}`);
  const parameters = {
    id: expense.id,
    fee: utils.readFee(expense.totalAmount, fee),
  };
  const result = await utils.graphqlQuery(query, parameters, hostAdmin);
  result.errors && console.log(result.errors);
  expect(result.errors).to.not.exist;
});

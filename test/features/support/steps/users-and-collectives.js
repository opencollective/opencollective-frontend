import { expect } from 'chai';
import { Given, When, Then } from 'cucumber';

import * as libtransactions from '../../../../server/lib/transactions';
import * as store from '../stores';
import * as utils from '../../../utils';

Given('a User {string}', async function (name) {
  const { user, userCollective } = await store.newUser(name);
  this.addValue(name, userCollective);
  this.addValue(`${name}-user`, user);
});

Given(/^a Collective "([^\"]+)" with a host in "([^\"]+)"(\, "([^\"]+)%" fee)?$/, async function (name, currency, fee) {
  const { hostCollective, hostAdmin, collective } = await store.hostAndCollective(name, currency, fee);
  this.addValue(name, collective);
  this.addValue(`${name}-hostAdmin`, hostAdmin);
  this.addValue(`${name}-host`, hostCollective);
});

When('{string} expenses {string} for {string} to {string} via {string}', async function (userName, value, description, collectiveName, payoutMethod) {
  const [ amount, currency ] = value.split(' ');
  const user = this.getValue(`${userName}-user`);
  const collective = this.getValue(collectiveName);
  const expense = {
    amount,
    currency,
    description,
    payoutMethod: payoutMethod.toLowerCase(),
    collective: { id: collective.id },
  };
  const query =
    `mutation createExpense($expense: ExpenseInputType!) {
      createExpense(expense: $expense) { id, status } }`;
  const result = await utils.graphqlQuery(
    query, { expense }, user);
  expect(result.errors).to.not.exist;
  this.addValue(`expense-${description}`, result.data.createExpense);
});

When('expense for {string} is approved by {string}', async function(description, collectiveName) {
  const hostAdmin = this.getValue(`${collectiveName}-hostAdmin`);
  const expense = this.getValue(`expense-${description}`);
  const query = `mutation approveExpense($id: Int!) { approveExpense(id: $id) { id } }`;
  const result = await utils.graphqlQuery(query, expense, hostAdmin);
  expect(result.errors).to.not.exist;
});

When('expense for {string} is paid by {string}', async function(description, collectiveName) {
  const hostAdmin = this.getValue(`${collectiveName}-hostAdmin`);
  const query = `mutation payExpense($id: Int!) { approveExpense(id: $id) { id } }`;
  const expense = this.getValue(`expense-${description}`);
  const result = await utils.graphqlQuery(query, expense, hostAdmin);
  expect(result.errors).to.not.exist;
});

Then('{string} should have contributed {string} to {string}', async function(userName, value, collectiveName) {
  const [ amount, currency ] = value.split(' ');
  const userCollective = this.getValue(userName);
  const collective = this.getValue(collectiveName);
  /* Doesn't ever sum up different currencies */
  const userToCollectiveAmount = await libtransactions.sum({
    FromCollectiveId: userCollective.id,
    CollectiveId: collective.id,
    currency,
  });
  expect(userToCollectiveAmount).to.equal(parseInt(amount));
});

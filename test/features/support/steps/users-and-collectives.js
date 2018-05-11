import { expect } from 'chai';
import { Given, When, Then } from 'cucumber';

import * as libpayments from '../../../../server/lib/payments';
import * as libtransactions from '../../../../server/lib/transactions';
import * as store from '../stores';
import * as utils from '../../../utils';

/** Helper for interpreting fee description
 *
 * The fee can be expressed as an absolute value, like "50" which
 * means $50.00 (the value will be multiplied by 100 to account for
 * the cents).
 *
 * The fee can also be expressed as a percentage of the value. In that
 * case it looks like "5%". That's why this helper takes the amount
 * parameter so the absolute value of the fee can be calculated.
 *
 * @param {Number} amount is the total amount of the expense. Used to
 *  calculate the absolute value of fees expressed as percentages.
 * @param {String} feeStr is the data read from the `.features` test
 *  file. That can be expressed as an absolute value or as a
 *  percentage.
 */
const readFee = (amount, feeStr) => {
  if (feeStr.endsWith('%')) {
    const asFloat = parseFloat(feeStr.replace('%', ''));
    return asFloat > 0 ? libpayments.calcFee(amount, asFloat) : asFloat;
  } else {
    return parseFloat(feeStr) * 100;
  }
};

Given('a User {string}', async function (name) {
  const { user, userCollective } = await store.newUser(name);
  this.addValue(name, userCollective);
  this.addValue(`${name}-user`, user);
});

Given('a Host {string} in {string} and charges {string} of fee', async function (name, currency, fee) {
  const { hostCollective, hostAdmin } = await store.newHost(name, currency, fee);
  this.addValue(name, hostCollective);
  this.addValue(`${name}-admin`, hostAdmin);
});

Given('a Collective {string} in {string} hosted by {string}', async function (name, currency, hostName) {
  const hostCollective = this.getValue(hostName);
  const hostAdmin = this.getValue(`${hostName}-admin`);
  const { collective } = await store.newCollectiveInHost(name, currency, hostCollective);
  this.addValue(name, collective);
  this.addValue(`${name}-host-collective`, hostCollective);
  this.addValue(`${name}-host-admin`, hostAdmin);
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
  const hostAdmin = this.getValue(`${collectiveName}-host-admin`);
  const expense = this.getValue(`expense-${description}`);
  const query = `mutation approveExpense($id: Int!) { approveExpense(id: $id) { id } }`;
  const result = await utils.graphqlQuery(query, expense, hostAdmin);
  expect(result.errors).to.not.exist;
});

When('expense for {string} is paid by {string} with {string} fee', async function(description, collectiveName, fee) {
  const hostAdmin = this.getValue(`${collectiveName}-host-admin`);
  const query = `mutation payExpense($id: Int!, $fee: Int!) { payExpense(id: $id, fee: $fee) { id } }`;
  const expense = this.getValue(`expense-${description}`);
  const parameters = { id: expense.id, fee: readFee(expense.totalAmount, fee) };
  const result = await utils.graphqlQuery(query, parameters, hostAdmin);
  result.errors && console.log(result.errors);
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
    type: 'CREDIT',
  });
  expect(userToCollectiveAmount).to.equal(parseInt(amount));
});

Then('{string} should have {string} in their balance', async function(collectiveName, value) {
  const [ amount, currency ] = value.split(' ');
  const collective = this.getValue(collectiveName);
  /* Doesn't ever sum up different currencies */
  const userToCollectiveAmount = await libtransactions.sum({
    FromCollectiveId: collective.id,
    CollectiveId: collective.id,
    currency,
  });
  expect(userToCollectiveAmount).to.equal(parseInt(amount));
});

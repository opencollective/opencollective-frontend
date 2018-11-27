import { expect } from 'chai';
import { Given, When, Then } from 'cucumber';

import * as libtransactions from '../../../../server/lib/transactions';
import * as store from '../stores';
import * as utils from '../../../utils';

Given('a User {string}', async function(name) {
  const { user, userCollective } = await store.newUser(name);
  this.addValue(name, userCollective);
  this.addValue(`${name}-user`, user);
});

Given('a User {string} as an {string} to {string}', async function(userName, role, collectiveName) {
  const { user, userCollective } = await store.newUser(userName);
  this.addValue(userName, userCollective);
  this.addValue(`${userName}-user`, user);
  const collective = this.getValue(collectiveName);
  collective.addUserWithRole(user, role);
});

Given('a Host {string} in {string} and charges {string} of fee', async function(name, currency, fee) {
  const { hostCollective, hostAdmin } = await store.newHost(name, currency, fee);
  this.addValue(name, hostCollective);
  this.addValue(`${name}-admin`, hostAdmin);
});

Given('an Organization {string} in {string} administered by {string}', async function(orgName, currency, userName) {
  const orgAdmin = this.getValue(`${userName}-user`);
  const organization = await store.newOrganization({ name: orgName, currency }, orgAdmin);
  this.addValue(orgName, organization);
});

Given('a Collective {string} in {string} hosted by {string}', async function(name, currency, hostName) {
  const hostCollective = this.getValue(hostName);
  const hostAdmin = this.getValue(`${hostName}-admin`);
  const { collective } = await store.newCollectiveInHost(name, currency, hostCollective);
  this.addValue(name, collective);
  this.addValue(`${name}-host-collective`, hostCollective);
  this.addValue(`${name}-host-admin`, hostAdmin);
});

Given('{string} is hosted by {string}', async function(collectiveName, hostName) {
  const hostCollective = this.getValue(hostName);
  const collective = this.getValue(collectiveName);
  collective.addHost(hostCollective);
});

Given('{string} connects a {string} account', async function(hostName, connectedAccountName) {
  const host = this.getValue(hostName);
  const hostAdmin = this.getValue(`${hostName}-admin`);
  const method = {
    stripe: store.stripeConnectedAccount,
  }[connectedAccountName.toLowerCase()];
  await method(host.id, hostAdmin.id);
});

Given('{string} payment processor fee is {string}', async function(ppName, feeStr) {
  this.addValue(`${ppName.toLowerCase()}-payment-provider-fee`, feeStr);
});

Given('platform fee is {string}', async function(feeStr) {
  this.addValue('platform-fee', feeStr);
});

async function handleDonation(fromName, value, toName, paymentMethod, userName = null) {
  const [amountStr, currency] = value.split(' ');
  const amount = parseInt(amountStr);
  const user = !userName ? this.getValue(`${userName ? userName : fromName}-user`) : this.getValue(`${fromName}-user`);
  const userCollective = this.getValue(fromName);
  const collective = this.getValue(toName);
  /* Retrieve fees that may or may not have been set */
  const paymentMethodName = paymentMethod.toLowerCase();
  const ppFee = utils.readFee(amount, this.getValue(`${paymentMethodName}-payment-provider-fee`));
  const appFee = utils.readFee(amount, this.getValue('platform-fee'));
  /* Use the appropriate stub to execute the order */
  const method = {
    stripe: store.stripeOneTimeDonation,
  }[paymentMethodName];
  if (!method) throw new Error(`Payment Method ${paymentMethod} doesn't exist`);
  return method({
    remoteUser: user,
    userCollective,
    collective,
    currency,
    amount,
    appFee,
    ppFee,
  });
}

When('{string} donates {string} to {string} via {string}', handleDonation);

When('{string} donates {string} to {string} via {string} as {string}', handleDonation);

Then('{string} should have contributed {string} to {string}', async function(userName, value, collectiveName) {
  const [amount, currency] = value.split(' ');
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
  const [amount, currency] = value.split(' ');
  const collective = this.getValue(collectiveName);
  /* Doesn't ever sum up different currencies */
  const userToCollectiveAmount = await libtransactions.sum({
    CollectiveId: collective.id,
    currency,
  });
  expect(userToCollectiveAmount).to.equal(parseInt(amount));
});

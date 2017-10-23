import { expect } from 'chai';
import { describe, it } from 'mocha';

import * as utils from './utils';
import models from '../server/models';
import roles from '../server/constants/roles';

let host, admin, user, collective, paypalPaymentMethod;

describe('graphql.paymentMethods.test.js', () => {

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.createUserWithCollective({
    name: "Pia",
    email: "pia@email.com"
  }).tap(u => admin = u));

  beforeEach(() => models.User.createUserWithCollective({
    name: 'Xavier',
    currency: 'EUR',
    email: 'xxxx@email.com'
  }).tap(u => user = u));

  beforeEach(() => models.Collective.create({
    name: 'open source collective',
    currency: 'USD'
  }).tap(c => host = c));

  beforeEach(() => models.Collective.create({
    name: "tipbox",
    currency: "EUR"
  }).tap(c => collective = c));

  beforeEach(() => models.Member.create({
    CollectiveId: collective.id,
    MemberCollectiveId: host.id,
    role: roles.HOST,
    CreatedByUserId: admin.id
  }));

  beforeEach(() => host.addUserWithRole(admin, roles.ADMIN));
  beforeEach(() => collective.addUserWithRole(admin, roles.ADMIN));

  beforeEach('create a paypal paymentMethod', () => models.PaymentMethod.create({
    service: 'paypal',
    name: 'host@paypal.com',
    data:  { redirect: "http://localhost:3000/brusselstogether/collectives/expenses" },
    token: 'PA-5GM04696CF662222W',
    CollectiveId: host.id
  }).then(pm => paypalPaymentMethod = pm));

  beforeEach('adding transaction from host (USD) to reimburse user\'s expense in a European chapter (EUR)', () => models.Transaction.createDoubleEntry({
    CreatedByUserId: admin.id,
    CollectiveId: host.id,
    HostCollectiveId: host.id,
    FromCollectiveId: user.CollectiveId,
    amount: -1000,
    currency: 'EUR',
    hostCurrency: 'USD',
    hostCurrencyFxRate: 1.15,
    amountInHostCurrency: -1150,
    paymentProcessorFeeInHostCurrency: 100,
    netAmountInCollectiveCurrency: -1250,
    PaymentMethodId: paypalPaymentMethod.id
  }));

  describe('oauth flow', () => {

  });

  describe('get the balance', () => {

    it("returns the balance", async () => {

      const query = `
      query Collective($slug: String!) {
        Collective(slug: $slug) {
          id,
          paymentMethods {
            id
            service
            balance
            currency
          }
        }
      }
      `;
      const result = await utils.graphqlQuery(query, { slug: host.slug }, admin);
      result.errors && console.errors(result.errors[0]);
      expect(result.errors).to.not.exist;
      console.log(result.data.Collective);
      const paymentMethod = result.data.Collective.paymentMethods.find(pm => pm.service === 'paypal');
      expect(paymentMethod.balance).to.equal(750)
    });

  })

});
import { expect } from 'chai';
import sinon from 'sinon';

import models from '../server/models';
import roles from '../server/constants/roles';
import * as libcurrency from '../server/lib/currency';
import paypalAdaptive from '../server/paymentProviders/paypal/adaptiveGateway';

import paypalMock from './mocks/paypal';
import dataMocks from './mocks/data';

import * as utils from './utils';
import { randEmail } from './stores';

let host, admin, user, collective, paypalPaymentMethod;

describe('graphql.paymentMethods.test.js', () => {
  beforeEach(async () => {
    await new Promise(res => setTimeout(res, 500));
    await utils.resetTestDB();
  });

  beforeEach(() =>
    models.User.createUserWithCollective({
      name: 'Host Admin',
      email: 'admin@email.com',
    }).tap(u => (admin = u)),
  );

  beforeEach(() =>
    models.User.createUserWithCollective({
      name: 'Xavier',
      currency: 'EUR',
      email: 'xxxx@email.com',
    }).tap(u => (user = u)),
  );

  beforeEach(() =>
    models.Collective.create({
      name: 'open source collective',
      type: 'ORGANIZATION',
      currency: 'USD',
    })
      .tap(c => (host = c))
      .then(c => c.becomeHost()),
  );

  beforeEach(() =>
    models.ConnectedAccount.create({
      CollectiveId: host.id,
      service: 'stripe',
    }),
  );

  beforeEach(() =>
    models.Collective.create({
      name: 'tipbox',
      type: 'COLLECTIVE',
      isActive: true,
      currency: 'EUR',
      hostFeePercent: 5,
      HostCollectiveId: host.id,
    }).tap(c => (collective = c)),
  );

  beforeEach(() =>
    models.Member.create({
      CollectiveId: collective.id,
      MemberCollectiveId: host.id,
      role: roles.HOST,
      CreatedByUserId: admin.id,
    }),
  );

  beforeEach(() => host.addUserWithRole(admin, roles.ADMIN));
  beforeEach(() => collective.addUserWithRole(admin, roles.ADMIN));

  beforeEach('create a paypal paymentMethod', () =>
    models.PaymentMethod.create({
      service: 'paypal',
      type: 'adaptive',
      name: 'host@paypal.com',
      data: {
        redirect: 'http://localhost:3000/brusselstogether/collectives/expenses',
      },
      token: 'PA-5GM04696CF662222W',
      CollectiveId: host.id,
    }).then(pm => (paypalPaymentMethod = pm)),
  );

  beforeEach("adding transaction from host (USD) to reimburse user's expense in a European chapter (EUR)", () =>
    models.Transaction.createDoubleEntry({
      CreatedByUserId: admin.id,
      CollectiveId: host.id,
      HostCollectiveId: host.id,
      FromCollectiveId: user.CollectiveId,
      amount: -1000,
      currency: 'EUR',
      hostCurrency: 'USD',
      hostCurrencyFxRate: 1.15,
      amountInHostCurrency: -1150,
      paymentProcessorFeeInHostCurrency: -100,
      netAmountInCollectiveCurrency: -1250,
      PaymentMethodId: paypalPaymentMethod.id,
    }),
  );

  describe('oauth flow', () => {
    // not implemented
  });

  describe('add funds', () => {
    let paymentMethod, order, sandbox;
    const fxrate = 1.1654; // 1 EUR = 1.1654 USD

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      sandbox.stub(libcurrency, 'getFxRate').callsFake(() => Promise.resolve(fxrate));
      return models.PaymentMethod.findOne({
        where: {
          service: 'opencollective',
          CollectiveId: host.id,
          type: 'collective',
        },
      }).then(pm => {
        paymentMethod = pm;
        order = {
          totalAmount: 1000, // €10
          collective: {
            id: collective.id,
          },
          paymentMethod: {
            uuid: pm.uuid,
          },
        };
      });
    });

    afterEach(() => {
      sandbox.restore();
    });

    const createOrderQuery = `
    mutation createOrder($order: OrderInputType!) {
      createOrder(order: $order) {
        id
        fromCollective {
          id
          slug
        }
        collective {
          id
          slug
        }
        totalAmount
        currency
        description
      }
    }
    `;

    it('fails to add funds if not logged in as an admin of the host', async () => {
      order.fromCollective = {
        id: host.id,
      };
      const result = await utils.graphqlQuery(createOrderQuery, { order }, user);
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal(
        "You don't have sufficient permissions to create an order on behalf of the open source collective organization",
      );

      order.user = {
        email: 'admin@neworg.com',
        name: 'Paul Newman',
      };
      order.fromCollective = {
        name: 'new org',
        website: 'http://neworg.com',
      };
      const result2 = await utils.graphqlQuery(createOrderQuery, { order }, user);
      expect(result2.errors).to.exist;
      expect(result2.errors[0].message).to.equal(
        "You don't have enough permissions to use this payment method (you need to be an admin of the collective that owns this payment method)",
      );
    });

    it('fails to change platformFeePercent if not root', async () => {
      order.fromCollective = {
        id: host.id,
      };
      order.platformFeePercent = 5;
      const result = await utils.graphqlQuery(createOrderQuery, { order }, user);
      expect(result.errors).to.exist;
      expect(result.errors[0].message).to.equal('Only a root can change the platformFeePercent');
    });

    it('adds funds from the host (USD) to the collective (EUR)', async () => {
      /**
       * collective ledger:
       * CREDIT
       *  - amount: €1000
       *  - fees: 0
       *  - netAmountInCollectiveCurrency: €1000
       *  - hostCurrency: USD
       *  - amountInHostCurrency: $1165 (1000 * fxrate:1.165)
       * fromCollective (host) ledger:
       * DEBIT
       *  - amount: -€1000
       *  - fees: 0
       *  - netAmountInCollectiveCurrency: -$1165
       *  - hostCurrency: USD
       *  - amountInHostCurrency: -$1165
       */
      order.fromCollective = {
        id: host.id,
      };
      const result = await utils.graphqlQuery(createOrderQuery, { order }, admin);
      result.errors && console.error(result.errors[0]);
      expect(result.errors).to.not.exist;
      const orderCreated = result.data.createOrder;
      const transaction = await models.Transaction.findOne({
        where: { OrderId: orderCreated.id, type: 'CREDIT' },
      });
      expect(transaction.FromCollectiveId).to.equal(transaction.HostCollectiveId);
      expect(transaction.hostFeeInHostCurrency).to.equal(0);
      expect(transaction.platformFeeInHostCurrency).to.equal(0);
      expect(transaction.paymentProcessorFeeInHostCurrency).to.equal(0);
      expect(transaction.hostCurrency).to.equal(host.currency);
      expect(transaction.amount).to.equal(order.totalAmount);
      expect(transaction.currency).to.equal(collective.currency);
      expect(transaction.hostCurrencyFxRate).to.equal(fxrate);
      expect(transaction.amountInHostCurrency).to.equal(Math.round(order.totalAmount * fxrate));
      expect(transaction.netAmountInCollectiveCurrency).to.equal(order.totalAmount);
      expect(transaction.amountInHostCurrency).to.equal(1165);
    });

    it('adds funds from the host (USD) to the collective (EUR) on behalf of a new organization', async () => {
      const hostFeePercent = 4;
      order.hostFeePercent = hostFeePercent;
      order.user = {
        email: 'admin@neworg.com',
        name: 'Paul Newman',
      };
      order.fromCollective = {
        name: 'new org',
        website: 'http://neworg.com',
      };
      const result = await utils.graphqlQuery(createOrderQuery, { order }, admin);
      result.errors && console.error(result.errors[0]);
      expect(result.errors).to.not.exist;
      const orderCreated = result.data.createOrder;
      const transaction = await models.Transaction.findOne({
        where: { OrderId: orderCreated.id, type: 'CREDIT' },
      });
      const org = await models.Collective.findOne({
        where: { slug: 'new-org' },
      });
      const adminMembership = await models.Member.findOne({
        where: { CollectiveId: org.id, role: 'ADMIN' },
      });
      const backerMembership = await models.Member.findOne({
        where: { MemberCollectiveId: org.id, role: 'BACKER' },
      });
      const orgAdmin = await models.Collective.findOne({
        where: { id: adminMembership.MemberCollectiveId },
      });
      expect(transaction.CreatedByUserId).to.equal(admin.id);
      expect(org.CreatedByUserId).to.equal(admin.id);
      expect(adminMembership.CreatedByUserId).to.equal(admin.id);
      expect(backerMembership.CreatedByUserId).to.equal(admin.id);
      expect(backerMembership.CollectiveId).to.equal(transaction.CollectiveId);
      expect(orgAdmin.CreatedByUserId).to.equal(admin.id);
      expect(orgAdmin.name).to.equal(order.user.name);
      expect(transaction.FromCollectiveId).to.equal(org.id);
      expect(transaction.hostFeeInHostCurrency).to.equal(
        -Math.round((hostFeePercent / 100) * order.totalAmount * fxrate),
      );
      expect(transaction.platformFeeInHostCurrency).to.equal(0);
      expect(transaction.paymentProcessorFeeInHostCurrency).to.equal(0);
      expect(transaction.hostCurrency).to.equal(host.currency);
      expect(transaction.currency).to.equal(collective.currency);
      expect(transaction.amount).to.equal(order.totalAmount);
      expect(transaction.netAmountInCollectiveCurrency).to.equal(order.totalAmount * (1 - hostFeePercent / 100));
      expect(transaction.amountInHostCurrency).to.equal(Math.round(order.totalAmount * fxrate));
      expect(transaction.hostCurrencyFxRate).to.equal(fxrate);
      expect(transaction.amountInHostCurrency).to.equal(1165);
    });

    it('gets the list of fromCollectives for the opencollective payment method of the host', async () => {
      // We add funds to the tipbox collective on behalf of Google and Facebook
      order.fromCollective = {
        name: 'facebook',
        website: 'https://facebook.com',
      };
      let result;
      result = await utils.graphqlQuery(createOrderQuery, { order }, admin);
      result.errors && console.error(result.errors[0]);
      order.fromCollective = {
        name: 'google',
        website: 'https://google.com',
      };
      result = await utils.graphqlQuery(createOrderQuery, { order }, admin);
      result.errors && console.error(result.errors[0]);

      // We fetch all the fromCollectives using the host paymentMethod
      const paymentMethodQuery = `
        query PaymentMethod($id: Int!) {
          PaymentMethod(id: $id) {
            id
            service
            type
            fromCollectives {
              total
              collectives {
                id
                slug
              }
            }
          }
        }
      `;
      result = await utils.graphqlQuery(paymentMethodQuery, { id: paymentMethod.id }, admin);
      result.errors && console.error(result.errors[0]);
      const { total, collectives } = result.data.PaymentMethod.fromCollectives;
      expect(total).to.equal(2);
      const slugs = collectives.map(c => c.slug).sort();
      expect(slugs[0]).to.equal('facebook');
      expect(slugs[1]).to.equal('google');
    });
  });

  describe('get the balance', () => {
    let preapprovalDetailsStub = null;

    before(() => {
      preapprovalDetailsStub = sinon.stub(paypalAdaptive, 'preapprovalDetails').callsFake(() => {
        return Promise.resolve({
          ...paypalMock.adaptive.preapprovalDetails.completed,
          curPaymentsAmount: '12.50',
          maxTotalAmountOfAllPayments: '2000.00',
        });
      });
    });

    after(() => {
      preapprovalDetailsStub.restore();
    });

    it('returns the balance', async () => {
      const query = `
      query Collective($slug: String) {
        Collective(slug: $slug) {
          id,
          paymentMethods {
            id
            service
            type
            balance
            currency
          }
        }
      }
      `;
      const result = await utils.graphqlQuery(query, { slug: host.slug }, admin);
      result.errors && console.error(result.errors[0]);

      // Ensure PayPal API is called
      expect(result.errors).to.not.exist;
      expect(preapprovalDetailsStub.callCount).to.equal(1);
      expect(preapprovalDetailsStub.firstCall.args).to.eql([paypalPaymentMethod.token]);

      // Ensure balance is returned
      const paymentMethod = result.data.Collective.paymentMethods.find(pm => pm.service === 'paypal');
      expect(preapprovalDetailsStub.callCount).to.equal(1);
      expect(paymentMethod.balance).to.equal(198750); // $2000 - $12.50
    });
  });
});

describe('CRUD', () => {
  // Queries
  const CreateCreditCardMutation = `
    mutation createCreditCard(
      $CollectiveId: Int!
      $name: String!
      $token: String!
      $data: StripeCreditCardDataInputType!
      $monthlyLimitPerMember: Int
    ) {
      createCreditCard(
        CollectiveId: $CollectiveId
        name: $name
        token: $token
        data: $data
        monthlyLimitPerMember: $monthlyLimitPerMember
      ) {
        id
      }
    }
  `;

  // Test variables
  let user = null;
  let externalUser = null;

  // Test preparation
  before(async () => {
    user = await models.User.createUserWithCollective({ email: randEmail() });
    externalUser = await models.User.createUserWithCollective({ email: randEmail() });
  });

  // Test begins
  describe('Add', () => {
    it('Must be authenticated', async () => {
      const result = await utils.graphqlQuery(
        CreateCreditCardMutation,
        { ...dataMocks.validCreditCard, CollectiveId: user.CollectiveId },
        null,
      );

      expect(result.errors[0].message).to.equal('You need to be logged in to create this payment method.');
    });

    it('Needs to be an admin', async () => {
      const result = await utils.graphqlQuery(
        CreateCreditCardMutation,
        { ...dataMocks.validCreditCard, CollectiveId: user.CollectiveId },
        externalUser,
      );

      expect(result.errors[0].message).to.equal('You must be an admin of this Collective.');
    });
  });
});

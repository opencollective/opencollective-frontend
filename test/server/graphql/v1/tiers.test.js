import Promise from 'bluebird';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';

import * as utils from '../../../utils';
import stripe from '../../../../server/lib/stripe';
import models from '../../../../server/models';
import { VAT_OPTIONS } from '../../../../server/constants/vat';

describe('server/graphql/v1/tiers', () => {
  let user1, user2, host, collective1, collective2, tier1, tierWithCustomFields, tierProduct, paymentMethod1;
  let sandbox;

  beforeEach(() => utils.resetTestDB());

  /**
   * Setup:
   * - User1 is a member of collective2 has a payment method on file
   * - User1 will become a backer of collective1
   * - Host is the host of both collective1 and collective2. It has a tax on "PRODUCT" tiers.
   */
  // Create users
  beforeEach(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user1 = u)));
  beforeEach(() => models.User.createUserWithCollective(utils.data('user2')).tap(u => (user2 = u)));

  // Create host
  beforeEach(async () => {
    host = await models.User.createUserWithCollective(utils.data('host1'));
    await host.collective.update({ countryISO: 'BE' });
  });

  // Create payment method
  beforeEach(() =>
    models.PaymentMethod.create({
      ...utils.data('paymentMethod2'),
      CreatedByUserId: user1.id,
      CollectiveId: user1.CollectiveId,
    }).tap(c => (paymentMethod1 = c)),
  );

  // Create test collectives
  beforeEach(() =>
    models.Collective.create({
      ...utils.data('collective1'),
      settings: { VAT: { type: VAT_OPTIONS.HOST } },
    }).tap(g => (collective1 = g)),
  );
  beforeEach(() => models.Collective.create(utils.data('collective2')).tap(g => (collective2 = g)));

  // Create tiers
  beforeEach(() => collective1.createTier(utils.data('tier1')).tap(t => (tier1 = t)));
  beforeEach(() => collective1.createTier(utils.data('tierWithCustomFields')).tap(t => (tierWithCustomFields = t)));
  beforeEach(() => collective1.createTier(utils.data('tierProduct')).tap(t => (tierProduct = t)));

  // Add hosts to collectives
  beforeEach(() => collective1.addHost(host.collective, host));
  beforeEach(() => collective2.addHost(host.collective, host));
  beforeEach(() => collective2.addUserWithRole(user1, 'ADMIN'));

  beforeEach('create stripe account', done => {
    models.ConnectedAccount.create({
      service: 'stripe',
      CollectiveId: host.collective.id,
      token: 'abc',
    })
      .tap(() => done())
      .catch(done);
  });

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => sandbox.restore());

  before(() => {
    sandbox.stub(stripe.tokens, 'create').callsFake(() => Promise.resolve({ id: 'tok_B5s4wkqxtUtNyM' }));

    sandbox.stub(stripe.customers, 'create').callsFake(() => Promise.resolve({ id: 'cus_B5s4wkqxtUtNyM' }));
    sandbox.stub(stripe.customers, 'retrieve').callsFake(() => Promise.resolve({ id: 'cus_B5s4wkqxtUtNyM' }));

    sandbox.stub(stripe.paymentIntents, 'create').callsFake(data =>
      Promise.resolve({
        charges: {
          data: [
            {
              id: 'ch_1AzPXHD8MNtzsDcgXpUhv4pm',
              amount: data.amount,
              balance_transaction: 'txn_19XJJ02eZvKYlo2ClwuJ1rbA',
            },
          ],
        },
        status: 'succeeded',
      }),
    );

    const balanceTransaction = {
      id: 'txn_19XJJ02eZvKYlo2ClwuJ1rbA',
      object: 'balance_transaction',
      amount: 999,
      available_on: 1483920000,
      created: 1483315442,
      currency: 'usd',
      description: null,
      fee: 59,
      fee_details: [
        {
          amount: 59,
          application: null,
          currency: 'usd',
          description: 'Stripe processing fees',
          type: 'stripe_fee',
        },
      ],
      net: 940,
      source: 'ch_19XJJ02eZvKYlo2CHfSUsSpl',
      status: 'pending',
      type: 'charge',
    };
    sandbox.stub(stripe.balanceTransactions, 'retrieve').callsFake(() => Promise.resolve(balanceTransaction));
  });

  describe('graphql.tiers.test.js', () => {
    describe('fetch tiers of a collective', () => {
      beforeEach(() =>
        collective1.createTier({
          slug: 'bronze-sponsor',
          name: 'bronze sponsor',
          amount: 0,
        }),
      );
      beforeEach(() => collective1.createTier({ slug: 'gold-sponsor', name: 'gold sponsor', amount: 0 }));

      const getTiersQuery = `
      query Collective($collectiveSlug: String, $tierSlug: String, $tierId: Int) {
        Collective(slug: $collectiveSlug) {
          tiers(slug: $tierSlug, id: $tierId) {
            id
            name
            customFields
          }
        }
      }`;

      it('fetch all tiers', async () => {
        const res = await utils.graphqlQuery(getTiersQuery, {
          collectiveSlug: collective1.slug,
        });
        res.errors && console.error(res.errors[0]);
        expect(res.errors).to.not.exist;
        const tiers = res.data.Collective.tiers;
        expect(tiers).to.have.length(5);
      });

      it('fetch tier with customFields', async () => {
        const res = await utils.graphqlQuery(getTiersQuery, {
          collectiveSlug: collective1.slug,
          tierId: tierWithCustomFields.id,
        });
        res.errors && console.error(res.errors[0]);
        expect(res.errors).to.not.exist;
        const tiers = res.data.Collective.tiers;
        expect(tiers).to.have.length(1);
        expect(tiers[0].name).to.equal(tierWithCustomFields.name);
        expect(tiers[0].customFields).to.have.length(1);
      });

      it('filter tiers by slug', async () => {
        const res = await utils.graphqlQuery(getTiersQuery, {
          collectiveSlug: collective1.slug,
          tierSlug: 'bronze-sponsor',
        });
        res.errors && console.error(res.errors[0]);
        expect(res.errors).to.not.exist;
        const tiers = res.data.Collective.tiers;
        expect(tiers).to.have.length(1);
        expect(tiers[0].name).to.equal('bronze sponsor');
      });

      it('filter tiers by tierId', async () => {
        const res = await utils.graphqlQuery(getTiersQuery, {
          collectiveSlug: collective1.slug,
          tierId: 1,
        });
        res.errors && console.error(res.errors[0]);
        expect(res.errors).to.not.exist;
        const tiers = res.data.Collective.tiers;
        expect(tiers).to.have.length(1);
        expect(tiers[0].id).to.equal(1);
      });
    });

    describe('payment methods', () => {
      const createOrderQuery = `
      mutation createOrder($order: OrderInputType!) {
        createOrder(order: $order) {
          createdByUser {
            id,
            email
          },
          paymentMethod {
            data,
            name
          },
          data
        }
      }`;

      const generateLoggedInOrder = () => {
        return {
          description: 'test order',
          collective: { id: collective1.id },
          tier: { id: tier1.id },
          paymentMethod: {
            service: 'stripe',
            name: '4242',
            token: 'tok_123456781234567812345678',
            data: {
              expMonth: 1,
              expYear: 2021,
              funding: 'credit',
              brand: 'Visa',
              country: 'US',
            },
          },
        };
      };

      const generateLoggedOutOrder = email => {
        return { ...generateLoggedInOrder(), user: { email } };
      };

      const generateLoggedInOrderWithCustomData = () => {
        return {
          ...generateLoggedInOrder(),
          tier: { id: tierWithCustomFields.id },
          customData: { jsonUrl: 'https://example.com/dep.json' },
        };
      };

      it('fails to use a payment method on file if not logged in', async () => {
        const order = generateLoggedOutOrder(user1.email);
        order.paymentMethod = { uuid: paymentMethod1.uuid, service: 'stripe' };

        const result = await utils.graphqlQuery(createOrderQuery, { order });
        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.equal('You need to be authenticated to perform this action');
      });

      it('fails to use a payment method on file if not logged in as the owner', async () => {
        const order = generateLoggedInOrder();
        order.paymentMethod = { uuid: paymentMethod1.uuid };

        const result = await utils.graphqlQuery(createOrderQuery, { order }, user2);
        expect(result.errors).to.exist;
        expect(result.errors[0].message).to.equal(
          "You don't have enough permissions to use this payment method (you need to be an admin of the collective that owns this payment method)",
        );
      });

      it('it create order with customData', async () => {
        const orderInput = generateLoggedInOrderWithCustomData();
        orderInput.paymentMethod = { uuid: paymentMethod1.uuid };
        const queryResult = await utils.graphqlQuery(createOrderQuery, { order: orderInput }, user1);
        expect(queryResult.errors).to.not.exist;
        const createdOrder = queryResult.data.createOrder;
        expect(createdOrder.data.customData).to.exist;
      });

      it('user1 becomes a backer of collective1 using a payment method on file', async () => {
        const orderInput = generateLoggedInOrder();
        orderInput.paymentMethod = { uuid: paymentMethod1.uuid };

        const result = await utils.graphqlQuery(createOrderQuery, { order: orderInput }, user1);
        result.errors && console.error(result.errors[0]);
        expect(result.errors).to.not.exist;

        const members = await models.Member.findAll({
          where: {
            MemberCollectiveId: user1.CollectiveId,
            CollectiveId: collective1.id,
          },
        });
        const orders = await models.Order.findAll({
          where: {
            FromCollectiveId: user1.CollectiveId,
            CollectiveId: collective1.id,
          },
        });
        // const subscription = await models.Subscription.findByPk(orders[0].SubscriptionId);
        const transactions = await models.Transaction.findAll({
          where: {
            FromCollectiveId: user1.CollectiveId,
            CollectiveId: collective1.id,
          },
        });

        expect(members).to.have.length(1);
        expect(orders).to.have.length(1);
        // TODO: Fix this when we fix Tiers
        // Currently, createOrder mutation overrides tier.interval with order.interval
        // expect(orders[0].SubscriptionId).to.not.be.null;
        // expect(subscription.interval).to.equal(tier1.interval);
        expect(transactions).to.have.length(1);
        expect(transactions[0].amount).to.equal(tier1.amount);
      });

      it('user1 becomes a backer of collective1 using a new payment method', async () => {
        const result = await utils.graphqlQuery(createOrderQuery, { order: generateLoggedInOrder() }, user1);
        result.errors && console.error(result.errors[0]);
        expect(result.errors).to.not.exist;
        const members = await models.Member.findAll({
          where: {
            MemberCollectiveId: user1.CollectiveId,
            CollectiveId: collective1.id,
          },
        });
        expect(members).to.have.length(1);
        const paymentMethods = await models.PaymentMethod.findAll({
          where: { CreatedByUserId: user1.id },
        });
        expect(paymentMethods).to.have.length(2);
      });
    });

    describe('VAT', () => {
      const createOrderQuery = `
        mutation createOrder($order: OrderInputType!) {
          createOrder(order: $order) {
            taxAmount
            data
            transactions {
              taxAmount
            }
          }
        }`;

      it('stores tax in order and transaction', async () => {
        const belgiumVAT = 21;
        const taxAmount = Math.round(tierProduct.amount * (belgiumVAT / 100));
        const order = {
          description: 'test order with tax',
          collective: { id: collective1.id },
          tier: { id: tierProduct.id },
          paymentMethod: { uuid: paymentMethod1.uuid },
          totalAmount: tierProduct.amount + taxAmount,
          taxAmount,
          countryISO: 'BE', // Required when order has tax
        };

        const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

        // There should be no errors
        res.errors && console.error(res.errors);
        expect(res.errors).to.not.exist;

        const createdOrder = res.data.createOrder;
        expect(createdOrder.taxAmount).to.equal(taxAmount);
        expect(createdOrder.data.tax).to.deep.equal({
          id: 'VAT',
          taxerCountry: 'BE',
          taxedCountry: 'BE',
          percentage: 21,
        });
        createdOrder.transactions.map(transaction => {
          expect(transaction.taxAmount).to.equal(-taxAmount);
        });
      });

      it("doesn't have tax when tax id number is set for other EU countries", async () => {
        const order = {
          description: 'test order with tax',
          collective: { id: collective1.id },
          tier: { id: tierProduct.id },
          paymentMethod: { uuid: paymentMethod1.uuid },
          totalAmount: tierProduct.amount,
          taxAmount: 0,
          countryISO: 'FR', // Required when order has tax
          taxIDNumber: 'FRXX999999998',
        };
        const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

        // There should be no errors
        res.errors && console.error(res.errors);
        expect(res.errors).to.not.exist;

        const createdOrder = res.data.createOrder;
        expect(createdOrder.taxAmount).to.equal(0);
        createdOrder.transactions.map(transaction => {
          expect(transaction.taxAmount).to.equal(0);
        });
      });

      it('have tax when tax id number is set with same EU country', async () => {
        const belgiumVAT = 21;
        const taxAmount = Math.round(tierProduct.amount * (belgiumVAT / 100));
        const order = {
          description: 'test order with tax',
          collective: { id: collective1.id },
          tier: { id: tierProduct.id },
          paymentMethod: { uuid: paymentMethod1.uuid },
          totalAmount: tierProduct.amount + taxAmount,
          taxAmount,
          countryISO: 'BE',
          taxIDNumber: 'BE0414445663',
        };
        const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

        // There should be no errors
        res.errors && console.error(res.errors);
        expect(res.errors).to.not.exist;

        const createdOrder = res.data.createOrder;
        expect(createdOrder.taxAmount).to.equal(taxAmount);
        createdOrder.transactions.map(transaction => {
          expect(transaction.taxAmount).to.equal(-taxAmount);
        });
      });

      it('reject orders without country when subject to VAT', async () => {
        const order = {
          description: 'test order with tax',
          collective: { id: collective1.id },
          tier: { id: tierProduct.id },
          paymentMethod: { uuid: paymentMethod1.uuid },
          totalAmount: tierProduct.amount,
          taxAmount: 0,
          taxIDNumber: 'FRXX999999998',
        };

        const queryResult = await utils.graphqlQuery(createOrderQuery, { order }, user1);
        expect(queryResult.errors[0].message).to.equal('This order has a tax attached, you must set a country');
      });

      it('rejects invalid VAT ID numbers', async () => {
        const order = {
          description: 'test order with tax',
          collective: { id: collective1.id },
          tier: { id: tierProduct.id },
          paymentMethod: { uuid: paymentMethod1.uuid },
          totalAmount: tierProduct.amount,
          taxAmount: 0,
          countryISO: 'FR',
          taxIDNumber: 'Not a valid number!',
        };

        const queryResult = await utils.graphqlQuery(createOrderQuery, { order }, user1);
        expect(queryResult.errors[0].message).to.equal('Invalid VAT number');
      });

      it('rejects invalid tax amount', async () => {
        const order = {
          description: 'test order with tax',
          collective: { id: collective1.id },
          tier: { id: tierProduct.id },
          paymentMethod: { uuid: paymentMethod1.uuid },
          totalAmount: tierProduct.amount,
          taxAmount: 0,
          countryISO: 'BE', // Required when order has tax
        };

        const queryResult = await utils.graphqlQuery(createOrderQuery, { order }, user1);
        expect(queryResult.errors[0].message).to.equal(
          'This tier uses a fixed amount. Order total must be $50.00 + $10.50 tax. You set: $50.00',
        );
      });
    });
  });
});

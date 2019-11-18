import config from 'config';
import nock from 'nock';
import sinon from 'sinon';
import { expect } from 'chai';
import { cloneDeep } from 'lodash';
import uuid from 'uuid/v4';

import models from '../server/models';
import twitter from '../server/lib/twitter';
import emailLib from '../server/lib/email';
import { maxInteger } from '../server/constants/math';

import * as utils from './utils';
import * as store from './stores';

const baseOrder = Object.freeze({
  quantity: 1,
  interval: null,
  totalAmount: 154300,
  paymentMethod: {
    name: '4242',
    token: 'tok_1B5j8xDjPFcHOcTm3ogdnq0K',
    data: {
      expMonth: 10,
      expYear: 2023,
      brand: 'Visa',
      country: 'US',
      funding: 'credit',
    },
  },
  collective: {
    id: null,
  },
});

const createOrderQuery = `
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) {
      id
      status
      description
      createdByUser {
        id
      }
      paymentMethod {
        id
      }
      totalAmount
      fromCollective {
        id
        slug
        name
        website
      }
      collective {
        id
        slug
        currency
      }
      subscription {
        id
        amount
        interval
        isActive
        stripeSubscriptionId
      }
    }
  }
  `;

const constants = Object.freeze({
  paymentMethod: {
    name: 'payment method',
    service: 'stripe',
    type: 'creditcard',
    data: {
      expMonth: 11,
      expYear: 2025,
    },
  },
});

describe('createOrder', () => {
  let sandbox, tweetStatusSpy, fearlesscitiesbrussels, emailSendMessageSpy;

  before(() => {
    nock('https://data.fixer.io')
      .get(/20[0-9]{2}\-[0-9]{2}\-[0-9]{2}/)
      .times(5)
      .query({
        access_key: config.fixer.accessKey,
        base: 'EUR',
        symbols: 'USD',
      })
      .reply(200, { base: 'EUR', date: '2017-09-01', rates: { USD: 1.192 } });

    nock('https://data.fixer.io')
      .get('/latest')
      .times(5)
      .query({
        access_key: config.fixer.accessKey,
        base: 'EUR',
        symbols: 'USD',
      })
      .reply(200, { base: 'EUR', date: '2017-09-22', rates: { USD: 1.1961 } }, ['Server', 'nosniff']);
  });

  after(() => nock.cleanAll());

  beforeEach(async () => {
    await utils.resetTestDB();
    sandbox = sinon.createSandbox();
    tweetStatusSpy = sandbox.spy(twitter, 'tweetStatus');
    emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');

    // Given a collective (with a host)
    ({ fearlesscitiesbrussels } = await store.newCollectiveWithHost('fearlesscitiesbrussels', 'EUR', 'EUR', 5));
    // And the above collective's host has a stripe account
    await store.stripeConnectedAccount(fearlesscitiesbrussels.HostCollectiveId);
    // And given that the above collective is active
    await fearlesscitiesbrussels.update({ isActive: true });
    // And given that the endpoint for creating customers on Stripe
    // is patched
    utils.stubStripeCreate(sandbox, {
      charge: {
        currency: 'eur',
        status: 'succeeded',
      },
      paymentIntent: {
        charges: { data: [{ id: 'ch_1AzPXHD8MNtzsDcgXpUhv4pm', currency: 'eur', status: 'succeeded' }] },
        status: 'succeeded',
      },
    });
    // And given the stripe stuff that depends on values in the
    // order struct is patch. It's here and not on each test because
    // the `totalAmount' field doesn't change throught the tests.
    utils.stubStripeBalance(sandbox, baseOrder.totalAmount, 'eur', Math.round(baseOrder.totalAmount * 0.05), 4500); // This is the payment processor fee.
  });

  afterEach(() => sandbox.restore());

  it('creates a pending order (pledge) if the collective is not active', async () => {
    const collective = await models.Collective.create({
      slug: 'test',
      name: 'test',
      isActive: false,
      website: 'https://github.com/opencollective/frontend',
    });
    const thisOrder = cloneDeep(baseOrder);
    thisOrder.collective.id = collective.id;

    const remoteUser = await models.User.createUserWithCollective({
      firstName: 'John',
      lastName: 'Smith',
      email: 'jsmith@email.com',
      twitterHandle: 'johnsmith',
      newsletterOptIn: true,
    });
    const res = await utils.graphqlQuery(
      createOrderQuery,
      {
        order: thisOrder,
      },
      remoteUser,
    );

    // There should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    expect(res.data.createOrder.status).to.equal('PENDING');
  });

  it('creates a pending order (pledge) with inactive subscription if interval is included and collective is not active', async () => {
    const collective = await models.Collective.create({
      slug: 'test',
      name: 'test',
      isActive: false,
      website: 'https://github.com/opencollective/frontend',
    });
    const thisOrder = cloneDeep(baseOrder);
    thisOrder.collective.id = collective.id;
    thisOrder.interval = 'month';

    const remoteUser = await models.User.createUserWithCollective({
      firstName: 'John',
      lastName: 'Smith',
      email: 'jsmith@email.com',
      twitterHandle: 'johnsmith',
      newsletterOptIn: true,
    });
    const res = await utils.graphqlQuery(
      createOrderQuery,
      {
        order: thisOrder,
      },
      remoteUser,
    );

    // There should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    expect(res.data.createOrder.status).to.equal('PENDING');
    expect(res.data.createOrder.subscription.interval).to.equal('month');
  });

  it('creates a pending order if the collective is active and the payment method type is manual', async () => {
    const hostAdmin = await models.User.create({ email: store.randEmail(), name: '_____' });
    const host = await models.Collective.create({
      slug: 'host-collective',
      name: 'Open Collective 501c3',
      currency: 'USD',
      CreatedByUserId: hostAdmin.id,
      settings: {
        paymentMethods: {
          manual: {
            instructions:
              'Your order is pending. Please send a wire to <code>IBAN 1234567890987654321</code> for the amount of {amount} with the mention: {collective} {tier} order: {OrderId} {unknownVariable}',
          },
        },
      },
    });
    const collective = await models.Collective.create({
      slug: 'webpack',
      name: 'test',
      currency: 'USD',
      isActive: true,
    });
    const event = await models.Collective.create({
      slug: 'meetup-ev1',
      name: 'meetup',
      type: 'EVENT',
      ParentCollectiveId: collective.id,
      isActive: true,
    });
    const tier = await models.Tier.create({
      slug: 'backer',
      name: 'best backer',
      amount: 1000,
      currency: collective.currency,
      CollectiveId: event.id,
    });
    await collective.addHost(host, hostAdmin, { shouldAutomaticallyApprove: true });
    await collective.update({ isActive: true });
    const thisOrder = cloneDeep(baseOrder);
    delete thisOrder.paymentMethod;
    thisOrder.paymentMethod = { type: 'manual' };
    thisOrder.collective.id = event.id;
    thisOrder.tier = { id: tier.id };
    thisOrder.quantity = 2;
    thisOrder.totalAmount = 2000;
    const remoteUser = await models.User.createUserWithCollective({
      firstName: 'John',
      lastName: 'Smith',
      email: 'jsmith@email.com',
      twitterHandle: 'johnsmith',
    });
    const res = await utils.graphqlQuery(
      createOrderQuery,
      {
        order: thisOrder,
      },
      remoteUser,
    );

    // There should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    expect(res.data.createOrder.status).to.equal('PENDING');
    const transactionsCount = await models.Transaction.count({
      where: { OrderId: res.data.createOrder.id },
    });
    expect(transactionsCount).to.equal(0);
    await utils.waitForCondition(() => emailSendMessageSpy.callCount > 1);
    expect(emailSendMessageSpy.callCount).to.equal(3);
    expect(emailSendMessageSpy.thirdCall.args[0]).to.equal(remoteUser.email);
    expect(emailSendMessageSpy.thirdCall.args[2]).to.match(/IBAN 1234567890987654321/);
    expect(emailSendMessageSpy.thirdCall.args[2]).to.match(
      /for the amount of \$20 with the mention: webpack event backer order: [0-9]+/,
    );
    expect(emailSendMessageSpy.thirdCall.args[1]).to.equal(
      'ACTION REQUIRED: your $20 registration to meetup is pending',
    );
  });

  it('creates an order as new user and sends a tweet', async () => {
    const order = cloneDeep(baseOrder);
    // And given a twitter connected account for the above
    // collective
    await models.ConnectedAccount.create({
      CollectiveId: fearlesscitiesbrussels.id,
      service: 'twitter',
      clientId: 'clientid',
      token: 'xxxx',
      settings: {
        newBacker: {
          active: true,
          tweet: '{backerTwitterHandle} thank you for your {amount} donation!',
        },
      },
    });
    // And given an order
    order.collective = { id: fearlesscitiesbrussels.id };
    const remoteUser = await models.User.createUserWithCollective({
      firstName: 'John',
      lastName: 'Smith',
      email: 'jsmith@email.com',
      twitterHandle: 'johnsmith',
      newsletterOptIn: true,
    });

    // When the query is executed
    const res = await utils.graphqlQuery(createOrderQuery, { order }, remoteUser);

    // Then there should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    const fromCollective = res.data.createOrder.fromCollective;
    const collective = res.data.createOrder.collective;
    const transaction = await models.Transaction.findOne({
      where: { CollectiveId: collective.id, amount: order.totalAmount },
    });
    expect(transaction.FromCollectiveId).to.equal(fromCollective.id);
    expect(transaction.CollectiveId).to.equal(collective.id);
    expect(transaction.currency).to.equal(collective.currency);
    expect(transaction.hostFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
    expect(transaction.platformFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
    expect(transaction.data.charge.currency).to.equal(collective.currency.toLowerCase());
    expect(transaction.data.charge.status).to.equal('succeeded');
    expect(transaction.data.balanceTransaction.net + transaction.hostFeeInHostCurrency).to.equal(
      transaction.netAmountInCollectiveCurrency,
    );
    // we create a customer on the host stripe account even for one time charges
    expect(transaction.data.charge.customer).to.not.be.null;

    const {
      createdByUser: { id },
    } = res.data.createOrder;
    const user = await models.User.findByPk(id);
    expect(user.newsletterOptIn).to.be.true;

    // make sure the payment has been recorded in the connected Stripe Account of the host
    expect(transaction.data.charge.currency).to.equal('eur');

    await utils.waitForCondition(() => tweetStatusSpy.callCount > 0);
    expect(tweetStatusSpy.firstCall.args[1]).to.contain('@johnsmith thank you for your €1,543 donation!');
  });

  it('creates an order for an event ticket and receives the ticket confirmation by email with iCal.ics attached', async () => {
    const d = new Date();
    const startsAt = d.setMonth(d.getMonth() + 1);
    const endsAt = new Date(startsAt);
    endsAt.setHours(endsAt.getHours() + 2);
    const event = await models.Collective.create({
      type: 'EVENT',
      isActive: true,
      ParentCollectiveId: fearlesscitiesbrussels.id,
      name: 'Sustain OSS London 2019',
      description: 'Short description',
      longDescription: 'Longer description',
      locationName: 'Github',
      address: 'San Francisco',
      slug: 'sustainoss-london',
      startsAt,
      endsAt,
    });
    // Given an order request
    const user = (await store.newUser('John Appleseed')).user;
    const newOrder = cloneDeep(baseOrder);
    newOrder.collective = { id: event.id };
    newOrder.totalAmount = 1000;

    // When the GraphQL query is executed
    let res;
    emailSendMessageSpy.resetHistory();
    res = await utils.graphqlQuery(createOrderQuery, { order: newOrder }, user);

    // There should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
    expect(emailSendMessageSpy.callCount).to.equal(1);
    expect(emailSendMessageSpy.firstCall.args[0]).to.equal(user.email);
    expect(emailSendMessageSpy.firstCall.args[1]).to.equal(`1 ticket confirmed for ${event.name}`);
    expect(emailSendMessageSpy.firstCall.args[2]).to.contain('kaaitheater'); // double check that we use the custom email for fearlesscitiesbrussels
    expect(emailSendMessageSpy.firstCall.args[3].attachments[0].filename).to.equal(`${event.slug}.ics`);
    expect(emailSendMessageSpy.firstCall.args[3].attachments[0].content).to.contain(
      '/fearlesscitiesbrussels/events/sustainoss-london',
    );

    // also test the different path for free tickets
    newOrder.totalAmount = 0;
    delete newOrder.paymentMethod;

    res = await utils.graphqlQuery(createOrderQuery, { order: newOrder }, user);

    // Make sure the order's status is PAID
    expect(res.data.createOrder.status).to.equal('PAID');
    expect(res.data.createOrder.description).to.equal('Registration to Sustain OSS London 2019');

    // Then there should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    await utils.waitForCondition(() => emailSendMessageSpy.callCount > 0);
    // expect(emailSendMessageSpy.callCount).to.equal(1); // this often fails (expect 2 to equal 1) :-/
    expect(emailSendMessageSpy.firstCall.args[0]).to.equal(user.email);
    expect(emailSendMessageSpy.firstCall.args[1]).to.equal(`1 ticket confirmed for ${event.name}`);
  });

  it('shoud not create an order as new incognito user', async () => {
    // Given an order request
    const newOrder = cloneDeep(baseOrder);
    newOrder.collective = { id: fearlesscitiesbrussels.id };
    newOrder.user = {
      firstName: '',
      lastName: '',
      email: 'jsmith@email.com',
    };
    newOrder.totalAmount = 0;
    delete newOrder.paymentMethod;

    // When the GraphQL query is executed
    const res = await utils.graphqlQuery(createOrderQuery, { order: newOrder });

    // Then there should be errors
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal('You have to be authenticated. Please login.');
  });

  it("doesn't store the payment method for user if order fail", async () => {
    const uniqueName = uuid();

    // Given an order request
    const newOrder = {
      ...cloneDeep(baseOrder),
      collective: { id: fearlesscitiesbrussels.id },
      paymentMethod: {
        name: uniqueName,
        token: 'tok_chargeDeclinedProcessingError', // See https://stripe.com/docs/testing#cards
        data: {
          expMonth: 10,
          expYear: 1999,
          brand: 'Visa',
          country: 'US',
          funding: 'credit',
        },
        save: true,
      },
    };
    const remoteUser = await models.User.createUserWithCollective({
      firstName: '',
      lastName: '',
      email: store.randEmail('rejectedcard@protonmail.ch'),
    });
    const res = await utils.graphqlQuery(createOrderQuery, { order: newOrder }, remoteUser);
    expect(res.errors[0].message).to.equal('Your card was declined.');
    const pm = await models.PaymentMethod.findOne({ where: { name: uniqueName } });
    expect(pm.saved).to.equal(false);
  });

  it('creates an order as logged in user', async () => {
    // Given a user
    const xdamman = (await store.newUser('xdamman')).user;
    const order = cloneDeep(baseOrder);
    // And given that the order is from the above user with the
    // above payment method
    order.fromCollective = { id: xdamman.CollectiveId };
    order.collective = { id: fearlesscitiesbrussels.id };
    // When the query is executed
    const res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);

    // Then there should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    // And then the creator of the order should be xdamman
    const collective = res.data.createOrder.collective;
    const transaction = await models.Transaction.findOne({
      where: { CollectiveId: collective.id, amount: order.totalAmount },
    });
    expect(transaction.FromCollectiveId).to.equal(xdamman.CollectiveId);
    expect(transaction.CollectiveId).to.equal(collective.id);
    expect(transaction.currency).to.equal(collective.currency);
    expect(transaction.hostFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
    expect(transaction.platformFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
    expect(transaction.data.charge.currency).to.equal(collective.currency.toLowerCase());
    expect(transaction.data.charge.status).to.equal('succeeded');
    expect(transaction.data.balanceTransaction.net + transaction.hostFeeInHostCurrency).to.equal(
      transaction.netAmountInCollectiveCurrency,
    );
    // make sure the payment has been recorded in the connected
    // Stripe Account of the host
    expect(transaction.data.charge.currency).to.equal('eur');
    const createdOrder = await models.Order.findByPk(res.data.createOrder.id);
    expect(createdOrder.status).to.equal('PAID');
  });

  it('creates an order as logged in user using saved credit card', async () => {
    // Given a user
    const xdamman = (await store.newUser('xdamman')).user;

    // And that this user has a payment method saved
    const pm = await models.PaymentMethod.create({
      CollectiveId: xdamman.CollectiveId,
      name: '4242',
      service: 'stripe',
      type: 'creditcard',
      token: 'tok_2B5j8xDjPFcHOcTm3ogdnq0K',
    });

    // And the order is setup with the above data
    const order = cloneDeep(baseOrder);
    order.collective = { id: fearlesscitiesbrussels.id };
    order.fromCollective = { id: xdamman.CollectiveId };
    order.paymentMethod = { uuid: pm.uuid };

    // When the order is created
    const res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);

    // There should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    // And the transaction has to have the data from the right user,
    // right collective, and right amounts
    const collective = res.data.createOrder.collective;
    const transaction = await models.Transaction.findOne({
      where: { CollectiveId: collective.id, amount: order.totalAmount },
    });
    expect(transaction.FromCollectiveId).to.equal(xdamman.CollectiveId);
    expect(transaction.CollectiveId).to.equal(collective.id);
    expect(transaction.currency).to.equal(collective.currency);
    expect(transaction.hostFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
    expect(transaction.platformFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
    expect(transaction.data.charge.currency).to.equal(collective.currency.toLowerCase());
    expect(transaction.data.charge.status).to.equal('succeeded');
    expect(transaction.data.balanceTransaction.net + transaction.hostFeeInHostCurrency).to.equal(
      transaction.netAmountInCollectiveCurrency,
    );
    // make sure the payment has been recorded in the connected
    // Stripe Account of the host
    expect(transaction.data.charge.currency).to.equal('eur');
  });

  it('creates a recurring donation as logged in user', async () => {
    // Given a user
    const xdamman = (await store.newUser('xdamman')).user;
    const order = cloneDeep(baseOrder);
    // And the parameters for the query
    order.fromCollective = { id: xdamman.CollectiveId };
    order.paymentMethod = {
      ...constants.paymentMethod,
      token: 'tok_1B5j8xDjPFcHOcTm3ogdnq0K',
    };
    order.interval = 'month';
    order.totalAmount = 1000;
    order.collective = { id: fearlesscitiesbrussels.id };
    // When the order is created
    const res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);

    // There should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    // Then the created transaction should match the requested data
    const orderCreated = res.data.createOrder;
    const { collective, subscription } = orderCreated;

    expect(subscription.interval).to.equal('month');
    expect(subscription.isActive).to.be.true;
    expect(subscription.amount).to.equal(order.totalAmount);

    const transaction = await models.Transaction.findOne({
      where: {
        CollectiveId: collective.id,
        FromCollectiveId: xdamman.CollectiveId,
        amount: order.totalAmount,
      },
    });

    // make sure the transaction has been recorded
    expect(transaction.FromCollectiveId).to.equal(xdamman.CollectiveId);
    expect(transaction.CollectiveId).to.equal(collective.id);
    expect(transaction.currency).to.equal(collective.currency);
    const createdOrder = await models.Order.findByPk(res.data.createOrder.id);
    expect(createdOrder.status).to.equal('ACTIVE');
  });

  it('creates an order as a new user for a new organization', async () => {
    const order = cloneDeep(baseOrder);
    // Given the following data for the order
    order.collective = { id: fearlesscitiesbrussels.id };
    order.user = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'jsmith@email.com',
    };
    order.fromCollective = { name: 'NewCo', website: 'newco.com' };
    order.paymentMethod = {
      ...constants.paymentMethod,
      token: 'tok_3B5j8xDjPFcHOcTm3ogdnq0K',
    };

    const remoteUser = await models.User.create({
      email: 'test@email.com',
    });

    // When the order is created
    const res = await utils.graphqlQuery(createOrderQuery, { order }, remoteUser);

    // There should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    const orderCreated = res.data.createOrder;
    const fromCollective = orderCreated.fromCollective;
    const collective = orderCreated.collective;
    const transactions = await models.Transaction.findAll({
      where: { OrderId: orderCreated.id },
    });
    expect(fromCollective.website).to.equal('https://newco.com'); // api should prepend https://
    expect(transactions.length).to.equal(2);
    expect(transactions[0].type).to.equal('DEBIT');
    expect(transactions[0].FromCollectiveId).to.equal(collective.id);
    expect(transactions[0].CollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].type).to.equal('CREDIT');
    expect(transactions[1].FromCollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].CollectiveId).to.equal(collective.id);
  });

  it('creates an order as a logged in user for an existing organization', async () => {
    const order = cloneDeep(baseOrder);
    // Given some users
    const xdamman = (await store.newUser('xdamman')).user;
    const duc = (await store.newUser('another user')).user;
    // And given an organization
    const newco = await models.Collective.create({
      type: 'ORGANIZATION',
      name: 'newco',
      CreatedByUserId: xdamman.id,
    });
    // And the order parameters
    order.fromCollective = { id: newco.id };
    order.collective = { id: fearlesscitiesbrussels.id };
    order.paymentMethod = {
      ...constants.paymentMethod,
      token: 'tok_4B5j8xDjPFcHOcTm3ogdnq0K',
    };
    // Should fail if not an admin or member of the organization
    let res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal(
      "You don't have sufficient permissions to create an order on behalf of the newco organization",
    );

    await models.Member.create({
      CollectiveId: newco.id,
      MemberCollectiveId: duc.CollectiveId,
      role: 'MEMBER',
      CreatedByUserId: duc.id,
    });

    res = await utils.graphqlQuery(createOrderQuery, { order }, duc);

    // There should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    const orderCreated = res.data.createOrder;
    const fromCollective = orderCreated.fromCollective;
    const collective = orderCreated.collective;
    const transactions = await models.Transaction.findAll({
      where: { OrderId: orderCreated.id },
    });
    expect(orderCreated.createdByUser.id).to.equal(duc.id);
    expect(transactions.length).to.equal(2);
    expect(transactions[0].type).to.equal('DEBIT');
    expect(transactions[0].FromCollectiveId).to.equal(collective.id);
    expect(transactions[0].CollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].type).to.equal('CREDIT');
    expect(transactions[1].FromCollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].CollectiveId).to.equal(collective.id);
  });

  it('fails if trying to donate using an existing email without being logged in', async () => {
    const order = cloneDeep(baseOrder);
    const legitUser = (
      await store.newUser('legit user', {
        email: store.randEmail('legit@opencollective.com'),
      })
    ).user;
    const remoteUser = null;
    order.collective = { id: fearlesscitiesbrussels.id };
    const res = await utils.graphqlQuery(
      createOrderQuery,
      { order: { ...order, user: { email: legitUser.email } } },
      remoteUser,
    );

    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal('An account already exists for this email address. Please login.');
  });

  it('fails if trying to donate using an existing paypal email without being logged in', async () => {
    const order = cloneDeep(baseOrder);
    const legitUser = (
      await store.newUser('legit user', {
        email: store.randEmail('legit@opencollective.com'),
        paypalEmail: store.randEmail('legit-paypal@opencollective.com'),
      })
    ).user;
    const remoteUser = null;
    order.collective = { id: fearlesscitiesbrussels.id };
    const res = await utils.graphqlQuery(
      createOrderQuery,
      { order: { ...order, user: { email: legitUser.paypalEmail } } },
      remoteUser,
    );

    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal('An account already exists for this email address. Please login.');
  });

  it("creates an order as a logged in user for an existing collective using the collective's payment method", async () => {
    const duc = (await store.newUser('another user')).user;
    const order = cloneDeep(baseOrder);
    const newco = await models.Collective.create({
      type: 'ORGANIZATION',
      name: 'newco',
      CreatedByUserId: duc.id,
    });
    order.collective = { id: fearlesscitiesbrussels.id };
    order.fromCollective = { id: newco.id };
    order.totalAmount = 20000;
    const paymentMethod = await models.PaymentMethod.create({
      ...constants.paymentMethod,
      token: 'tok_5B5j8xDjPFcHOcTm3ogdnq0K',
      monthlyLimitPerMember: 10000,
      CollectiveId: newco.id,
    });
    order.paymentMethod = { uuid: paymentMethod.uuid };

    // Should fail if not an admin or member of the organization
    let res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal(
      "You don't have sufficient permissions to create an order on behalf of the newco organization",
    );

    await models.Member.create({
      CollectiveId: newco.id,
      MemberCollectiveId: duc.CollectiveId,
      role: 'MEMBER',
      CreatedByUserId: duc.id,
    });

    // Should fail if order.totalAmount > PaymentMethod.monthlyLimitPerMember
    res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal(
      'The total amount of this order (€200 ~= $239) is higher than your monthly spending limit on this payment method (stripe:creditcard) ($100)',
    );

    sandbox.useFakeTimers(new Date('2017-09-22').getTime());
    await paymentMethod.update({ monthlyLimitPerMember: 25000 }); // $250 limit
    res = await utils.graphqlQuery(createOrderQuery, { order }, duc);

    // There should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    const availableBalance = await paymentMethod.getBalanceForUser(duc);
    expect(availableBalance.amount).to.equal(1160);

    const orderCreated = res.data.createOrder;
    const fromCollective = orderCreated.fromCollective;
    const collective = orderCreated.collective;
    const transactions = await models.Transaction.findAll({
      where: { OrderId: orderCreated.id },
      order: [['id', 'ASC']],
    });
    expect(orderCreated.createdByUser.id).to.equal(duc.id);
    expect(transactions.length).to.equal(2);
    expect(transactions[0].type).to.equal('DEBIT');
    expect(transactions[0].FromCollectiveId).to.equal(collective.id);
    expect(transactions[0].CollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].type).to.equal('CREDIT');
    expect(transactions[1].FromCollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].CollectiveId).to.equal(collective.id);

    // Should fail if order.totalAmount > PaymentMethod.getBalanceForUser
    res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal(
      "You don't have enough funds available ($12 left) to execute this order (€200 ~= $239)",
    );
  });

  describe('host moves funds between collectives', async () => {
    const order = cloneDeep(baseOrder);
    let hostAdmin, hostCollective;

    beforeEach(async () => {
      // First clean the database
      await utils.resetTestDB();
      // Given a host collective and its admin
      ({ hostAdmin, hostCollective } = await store.newHost('host-collective', 'USD', 10));
      // And the above collective's host has a stripe account
      await store.stripeConnectedAccount(hostCollective.id);
      // And given two collectives in that host
      const fromCollective = (await store.newCollectiveInHost('opensource', 'USD', hostCollective)).collective;
      await fromCollective.update({ isActive: true });
      const { collective } = await store.newCollectiveInHost('apex', 'USD', hostCollective);
      await collective.update({ isActive: true });
      // And given a payment method for the host
      const paymentMethod = await models.PaymentMethod.create({
        service: 'opencollective',
        CollectiveId: fromCollective.id,
      });
      // And given the following changes for the order
      order.fromCollective = { id: fromCollective.id };
      order.collective = { id: collective.id };
      order.paymentMethod = { uuid: paymentMethod.uuid };
      order.interval = null;
      order.totalAmount = maxInteger;
      delete order.tier;
      // And add some funds to the fromCollective
      await models.Transaction.create({
        CreatedByUserId: hostAdmin.id,
        HostCollectiveId: fromCollective.HostCollectiveId,
        CollectiveId: fromCollective.id,
        netAmountInCollectiveCurrency: 746149,
        type: 'CREDIT',
        currency: 'USD',
      });
    });

    it('Should fail if not enough funds in the fromCollective', async () => {
      const res = await utils.graphqlQuery(createOrderQuery, { order }, hostAdmin);
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal(
        "You don't have enough funds available ($7,461 left) to execute this order ($21,474,836)",
      );
    });

    it('succeeds', async () => {
      order.totalAmount = 20000;
      const res = await utils.graphqlQuery(createOrderQuery, { order }, hostAdmin);
      expect(res.errors).to.not.exist;
    });
  });

  it("creates an order as a logged in user for an existing collective using the collective's balance", async () => {
    const xdamman = (await store.newUser('xdamman')).user;
    const order = cloneDeep(baseOrder);
    const { hostCollective } = await store.newHost('Host Collective', 'USD', 10);
    const fromCollective = (await store.newCollectiveInHost('opensource', 'USD', hostCollective)).collective;
    await fromCollective.update({ isActive: true });
    const collective = (await store.newCollectiveInHost('apex', 'USD', hostCollective)).collective;
    await collective.update({ isActive: true });

    await models.Member.create({
      CreatedByUserId: xdamman.id,
      CollectiveId: fromCollective.id,
      MemberCollectiveId: xdamman.CollectiveId,
      role: 'ADMIN',
    });

    const paymentMethod = await models.PaymentMethod.create({
      CreatedByUserId: xdamman.id,
      service: 'opencollective',
      type: 'collective',
      CollectiveId: fromCollective.id,
    });

    await models.Transaction.create({
      CreatedByUserId: xdamman.id,
      HostCollectiveId: fromCollective.HostCollectiveId,
      CollectiveId: fromCollective.id,
      netAmountInCollectiveCurrency: 746149,
      type: 'CREDIT',
      currency: 'USD',
    });

    order.fromCollective = { id: fromCollective.id };
    order.collective = { id: collective.id };
    order.paymentMethod = { uuid: paymentMethod.uuid };
    order.interval = null;
    order.totalAmount = maxInteger;
    delete order.tier;

    // Should fail if not enough funds in the fromCollective
    let res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
    expect(res.errors).to.exist;
    expect(res.errors[0].message).to.equal(
      "You don't have enough funds available ($7,461 left) to execute this order ($21,474,836)",
    );

    order.totalAmount = 20000;

    res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);

    // There should be no errors
    res.errors && console.error(res.errors);
    expect(res.errors).to.not.exist;

    const availableBalance = await paymentMethod.getBalanceForUser(xdamman);
    expect(availableBalance.amount).to.equal(726149);

    const orderCreated = res.data.createOrder;
    const transactions = await models.Transaction.findAll({
      where: { OrderId: orderCreated.id },
    });
    expect(orderCreated.createdByUser.id).to.equal(xdamman.id);
    expect(transactions.length).to.equal(2);
    expect(transactions[0].type).to.equal('DEBIT');
    expect(transactions[0].FromCollectiveId).to.equal(collective.id);
    expect(transactions[0].CollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].type).to.equal('CREDIT');
    expect(transactions[1].FromCollectiveId).to.equal(fromCollective.id);
    expect(transactions[1].CollectiveId).to.equal(collective.id);
  });
});

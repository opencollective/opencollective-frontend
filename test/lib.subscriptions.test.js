import config from 'config';

// Testing tools
import sinon from 'sinon';
import { expect } from 'chai';
import * as utils from './utils';

// Supporting libraries
import models from '../server/models';
import emailLib from '../server/lib/email';
import * as paymentsLib from '../server/lib/payments';
import status from '../server/constants/order_status';
import { randEmail } from './stores';

// What's being tested
import {
  MAX_RETRIES,
  handleRetryStatus,
  getNextChargeAndPeriodStartDates,
  getChargeRetryCount,
  ordersWithPendingCharges,
  processOrderWithSubscription,
  groupProcessedOrders,
} from '../server/lib/subscriptions';

async function createOrderWithSubscription(interval, date, quantity = 1) {
  const payment = { amount: 1000, currency: 'USD', interval };
  const user = await models.User.createUserWithCollective({ email: randEmail(), name: 'Test McTesterson' });
  const fromCollective = await models.Collective.create({ email: randEmail(), name: 'Donor Collective' });
  const collective = await models.Collective.create({ name: 'Parcel' });
  const tier = await models.Tier.create({ name: 'backer', amount: 0 });
  const subscription = await models.Subscription.create({
    ...payment,
    isActive: true,
    activatedAt: new Date('2018-01-27 0:0'),
    nextChargeDate: new Date(`${date} 0:0`),
    nextPeriodStart: new Date(`${date} 0:0`),
    chargeNumber: 0,
    quantity,
  });
  const order = await models.Order.create({
    CreatedByUserId: user.id,
    FromCollectiveId: user.CollectiveId,
    CollectiveId: collective.id,
    TierId: tier.id,
    SubscriptionId: subscription.id,
    totalAmount: payment.amount,
    currency: payment.currency,
    interval: payment.interval,
  });
  order.Subscription = subscription;
  order.fromCollective = fromCollective;
  order.collective = collective;
  order.createdByUser = user;
  return { order, subscription, user, collective };
}

describe('LibSubscription', () => {
  describe('#getNextChargeAndPeriodStartDates', () => {
    it("should use the next month's first day for monthly subscriptions", () => {
      // Given the following order with subscription
      const order = {
        Subscription: {
          interval: 'month',
          nextPeriodStart: new Date('2018-01-01'),
          nextChargeDate: new Date('2018-01-01'),
        },
      };

      // When dates are updated with success
      const updatedDates = getNextChargeAndPeriodStartDates('new', order);

      // Then both dates should be advanced to the first day of the
      // next month
      expect(updatedDates.nextPeriodStart.getTime()).to.equal(new Date('2018-02-01 0:0').getTime());
      expect(updatedDates.nextChargeDate.getTime()).to.equal(new Date('2018-02-01 0:0').getTime());
    });

    it('should use the next 2 months first day for monthly subscriptions on or after 15th', () => {
      // Given the following order with subscription
      const order = {
        Subscription: {
          interval: 'month',
          nextPeriodStart: new Date('2018-01-30'),
          nextChargeDate: new Date('2018-01-30'),
        },
      };

      // When dates are updated with success
      const updatedDates = getNextChargeAndPeriodStartDates('new', order);

      // The subscription was made after the 15th the next charge should be in 2 months time, first day.
      expect(updatedDates.nextPeriodStart.getTime()).to.equal(new Date('2018-03-01 0:0').getTime());
      expect(updatedDates.nextChargeDate.getTime()).to.equal(new Date('2018-03-01 0:0').getTime());
    });

    it('should use first day of the same month next year for yearly subscriptions', () => {
      // Given the following order & subscription
      const order = {
        Subscription: {
          interval: 'year',
          nextPeriodStart: new Date('2018-01-30'),
          nextChargeDate: new Date('2018-01-30'),
        },
      };

      // When dates are updated with success
      const updatedDates = getNextChargeAndPeriodStartDates('new', order);

      // Then both dates should be advanced
      expect(updatedDates.nextPeriodStart.getTime()).to.equal(new Date('2019-01-01 0:0').getTime());
      expect(updatedDates.nextChargeDate.getTime()).to.equal(new Date('2019-01-01 0:0').getTime());
    });

    it('should bump the nextChargeDate by two days from today on failure', () => {
      // Given the following order & subscription
      const order = {
        Subscription: {
          interval: 'year',
          nextPeriodStart: new Date('2018-01-20 0:0'),
          nextChargeDate: new Date('2018-01-20 0:0'),
        },
      };

      // And given that we freeze time
      const clock = sinon.useFakeTimers(new Date('2018-01-28 0:0').getTime());

      // When dates are updated with failure
      const updatedDates = getNextChargeAndPeriodStartDates('failure', order);

      try {
        // Then just the nextCharge date should be updated. The date
        // that saves the last period's start should keep the same value
        expect(updatedDates.nextPeriodStart).to.equal(undefined);
        expect(updatedDates.nextChargeDate.getTime()).to.equal(new Date('2018-01-30 0:0').getTime());
      } finally {
        clock.restore();
      }
    });

    it('should bump nextChargeDate according to nextPeriodStart after success', () => {
      // Given the following order & subscription
      const order = {
        Subscription: {
          interval: 'month',
          nextPeriodStart: new Date('2018-01-20 0:0'),
          nextChargeDate: new Date('2018-01-22 0:0'),
        },
      };

      // When dates are updated with success
      const updatedDates = getNextChargeAndPeriodStartDates('success', order);

      // Then both dates should be updated based on nextPeriodStart
      // rather than nextChargeDate
      expect(updatedDates.nextPeriodStart.getTime()).to.equal(new Date('2018-02-20 0:0').getTime());
      expect(updatedDates.nextChargeDate.getTime()).to.equal(new Date('2018-02-20 0:0').getTime());
    });

    it('should use the createdAt field when `nextChargeDate` is null', () => {
      // Given the following order & subscription
      const order = {
        Subscription: {
          interval: 'month',
          nextPeriodStart: null,
          nextChargeDate: null,
          createdAt: new Date('2018-01-01'),
        },
      };

      // When dates are updated with success
      const updatedDates = getNextChargeAndPeriodStartDates('new', order);

      // Then both dates should be updated according to createdAt
      expect(updatedDates.nextPeriodStart.getTime()).to.equal(new Date('2018-02-01 0:0').getTime());
      expect(updatedDates.nextChargeDate.getTime()).to.equal(new Date('2018-02-01 0:0').getTime());
    });

    it("should set the nextChargeDate to today and not modify nextPeriodStart when status is 'updated'", () => {
      // Given the following order & subscription
      const order = {
        Subscription: {
          interval: 'year',
          nextPeriodStart: new Date('2018-01-20 0:0'),
          nextChargeDate: new Date('2018-01-20 0:0'),
        },
      };

      // And given that we freeze time
      const clock = sinon.useFakeTimers(new Date('2018-01-28 0:0').getTime());

      // when dates are updated with 'updated' status
      const updatedDates = getNextChargeAndPeriodStartDates('updated', order);

      try {
        // Then only nextChargeDate should be set to today;
        expect(updatedDates.nextChargeDate.getTime()).to.equal(new Date().getTime());
      } finally {
        clock.restore();
      }
    });
  });

  describe('#getChargeRetryCount', () => {
    it('should increment the counter if status is fail', () => {
      const order = { Subscription: { chargeRetryCount: 0 } };
      const chargeRetryCount = getChargeRetryCount('failure', order);
      expect(chargeRetryCount).to.equal(1);
    });
    it('should reset the counter to zero on success', () => {
      const order = { Subscription: { chargeRetryCount: 5 } };
      const chargeRetryCount = getChargeRetryCount('success', order);
      expect(chargeRetryCount).to.equal(0);
    });
    it('should reset the counter to zero on updated', () => {
      const order = { Subscription: { chargeRetryCount: 5 } };
      const chargeRetryCount = getChargeRetryCount('updated', order);
      expect(chargeRetryCount).to.equal(0);
    });
  });

  describe('#handleRetryStatus', () => {
    let emailMock;
    beforeEach(() => (emailMock = sinon.mock(emailLib)));
    afterEach(() => emailMock.restore());
    it('should send confirmation email when processing is successful', async () => {
      // Given the following order with fields required by the email
      // template
      const order = {
        Subscription: { chargeRetryCount: 0 },
        collective: { getRelatedCollectives: () => Promise.resolve(null) },
        fromCollective: { slug: 'cslug' },
        createdByUser: { email: 'test@oc.com' },
      };

      // And given that we expect the method send from the mock to be
      // called
      emailMock
        .expects('send')
        .once()
        .withArgs('thankyou', 'test@oc.com');

      // When the status of the order is handled
      await handleRetryStatus(order, {});

      // Then the email mock should be verified
      emailMock.verify();
    });

    it('should send a failure email if retries are > 0 & < MAX_RETRIES', async () => {
      // Given an order
      const order = {
        Subscription: { chargeRetryCount: 1 },
        collective: {},
        fromCollective: { slug: 'cslug' },
        createdByUser: { email: 'test@oc.com' },
      };

      // And given that we expect the method send from the mock to be
      // called
      emailMock
        .expects('send')
        .once()
        .withArgs('payment.failed', 'test@oc.com', {
          lastAttempt: false,
          order: order.info,
          collective: order.collective.info,
          fromCollective: order.fromCollective.minimal,
          subscriptionsLink: `${config.host.website}/cslug/subscriptions`,
        });

      // When the status of the order is handled
      await handleRetryStatus(order, {});

      // Then the email mock should be verified
      emailMock.verify();
    });

    it('should send a cancelation email if retries are >= MAX_RETRIES', async () => {
      // Given an order
      const order = {
        Subscription: { chargeRetryCount: MAX_RETRIES },
        collective: {},
        fromCollective: { slug: 'cslug' },
        createdByUser: { email: 'test@oc.com' },
      };

      // And given that we expect the method send from the mock to be
      // called
      emailMock
        .expects('send')
        .once()
        .withArgs('payment.failed', 'test@oc.com', {
          lastAttempt: true,
          order: order.info,
          collective: order.collective.info,
          fromCollective: order.fromCollective.minimal,
          subscriptionsLink: `${config.host.website}/cslug/subscriptions`,
        });

      // When the status of the order is handled
      await handleRetryStatus(order, {});

      // Then the email mock should be verified
      emailMock.verify();
    });
  });

  describe('#processOrderWithSubscription', () => {
    let emailMock;
    beforeEach(() => (emailMock = sinon.mock(emailLib)));
    afterEach(() => emailMock.restore());

    it('not do anything if dryRun is true', async () => {
      // Given the following order
      const order = {
        Subscription: { id: 1, save: sinon.spy() },
        collective: {},
        fromCollective: {},
        createdByUser: { email: 'test@oc.com', generateLoginLink: () => '/' },
      };

      // And given that we don't want send to be called at all
      emailMock.expects('send').never();

      // When the order above is processed
      const entry = await processOrderWithSubscription({ dryRun: true }, order);

      // Then nothing was attempted
      expect(entry.status).to.equal('unattempted');
      expect(order.Subscription.save.getCalls()).to.be.empty;

      // And then the email mock should be verified
      emailMock.verify();
    });

    describe('Update dates after processing an order @database', () => {
      let paymentsStub, emailMock, clock;

      beforeEach(async () => {
        clock = sinon.useFakeTimers(new Date('2018-01-28 0:0').getTime());
        emailMock = sinon.mock(emailLib);
        paymentsStub = sinon.stub(paymentsLib, 'processOrder');
        await utils.resetTestDB();
      });

      afterEach(() => {
        clock.restore();
        emailMock.restore();
        paymentsStub.restore();
      });

      it('should update dates after successfuly processing monthly ', async () => {
        // Given an order with a subscription
        const { order } = await createOrderWithSubscription('month', '2018-01-27');

        // And given that an email should be sent afterwards
        emailMock
          .expects('send')
          .once()
          .withArgs('thankyou');

        // And that the payments library will return a transaction (to
        // be included in the email)
        paymentsStub.resolves({ info: 'Transaction' });

        // When the order is processed
        const entry = await processOrderWithSubscription({ dryRun: false }, order);

        // Expect the mock expectations to be verified. The right
        // email was sent.
        emailMock.verify();
        // Expect the processOrder function was called
        expect(paymentsStub.called).to.be.true;

        // And then the status of the processing is successful
        expect(entry.status).to.equal('success');

        // And then the dates are incremented by one month
        expect(order.Subscription.nextChargeDate.getTime()).to.equal(new Date('2018-02-27 0:0').getTime());
        expect(order.Subscription.nextPeriodStart.getTime()).to.equal(new Date('2018-02-27 0:0').getTime());
      });

      it('should update dates after successfuly processing yearly ', async () => {
        // Given an order with a subscription
        const { order } = await createOrderWithSubscription('year', '2018-01-27');

        // And given that an email should be sent afterwards
        emailMock
          .expects('send')
          .once()
          .withArgs('thankyou');

        // And that the payments library will return a transaction (to
        // be included in the email)
        paymentsStub.resolves({ info: 'Transaction' });

        // When the order is processed
        const entry = await processOrderWithSubscription({ dryRun: false }, order);

        // Expect the mock expectations to be verified. The right
        // email was sent.
        emailMock.verify();
        // Expect the processOrder function was called
        expect(paymentsStub.called).to.be.true;

        // And then the status of the processing is successful
        expect(entry.status).to.equal('success');

        // And then the dates are incremented by one month
        expect(order.Subscription.nextChargeDate.getTime()).to.equal(new Date('2019-01-27 0:0').getTime());
        expect(order.Subscription.nextPeriodStart.getTime()).to.equal(new Date('2019-01-27 0:0').getTime());
      });

      it('should update nextChargeDate after failed processing yearly ', async () => {
        // Given an order with a subscription
        const { order } = await createOrderWithSubscription('year', '2018-01-27');

        // And given that an email should be sent afterwards
        emailMock
          .expects('send')
          .once()
          .withArgs('payment.failed');

        // And that the payments library will throw an error
        paymentsStub.rejects('TypeError -- Whatever');

        // When the order is processed
        const entry = await processOrderWithSubscription({ dryRun: false }, order);

        // Expect the mock expectations to be verified. The right
        // email was sent.
        emailMock.verify();

        // Expect the processOrder function was called
        expect(paymentsStub.called).to.be.true;

        // And then the status of the processing is successful
        expect(entry.status).to.equal('failure');

        // And then the nextChargeDate is ajusted for two days later
        expect(order.Subscription.nextChargeDate.getTime()).to.equal(new Date('2018-01-30 0:0').getTime());

        // And the nextPeriodStart doesn't change for a failed
        // processing
        expect(order.Subscription.nextPeriodStart.getTime()).to.equal(new Date('2018-01-27 0:0').getTime());
      });

      it('should increment chargeNumber after successfuly processing the order', async () => {
        // Given an order with a subscription
        const { order } = await createOrderWithSubscription('month', '2018-04-17');

        paymentsStub.resolves({});

        // When the order is processed
        const entry = await processOrderWithSubscription({ dryRun: false }, order);

        // Then expect the stub of the payment lib to be called
        expect(paymentsStub.called).to.be.true;

        // And then the status of the processing is successful
        expect(entry.status).to.equal('success');

        // Then charge number (that started with 0) should be 1
        expect(order.Subscription.chargeNumber).to.equal(1);
      });

      it('should NOT increment chargeNumber after failure processing order', async () => {
        // Given an order with a subscription
        const { order } = await createOrderWithSubscription('month', '2018-04-17');

        // And that the payments library will throw an error
        paymentsStub.rejects('TypeError -- Whatever');

        // When the order is processed
        const entry = await processOrderWithSubscription({ dryRun: false }, order);

        // Then expect the stub of the payment lib to be called
        expect(paymentsStub.called).to.be.true;

        // And then the status of the processing fails
        expect(entry.status).to.equal('failure');

        // And then charge number continues to be 0
        expect(order.Subscription.chargeNumber).to.equal(0);

        // And the subscription shoult not be canceled
        expect(order.Subscription.deactivatedAt).to.be.null;
      });

      it('should cancel the subscription if chargeNumber === quantity', async () => {
        // Given an order with a subscription valid for two months
        const { order, subscription } = await createOrderWithSubscription('month', '2018-04-17', 2);
        // And given that we'll tweak its chargeNumber field to the
        // quantity of intervals
        await subscription.update({ chargeNumber: 2 });

        // When the order is processed
        const entry = await processOrderWithSubscription({ dryRun: false }, order);

        // Then expect the stub of the payment lib to NOT be called!
        // No charge should happen!!!
        expect(paymentsStub.called).to.be.false;

        // And then the status of the processing fails
        expect(entry.status).to.equal('failure');

        // And then charge number continues to be unchanged
        expect(order.Subscription.chargeNumber).to.equal(2);

        // And the subscription should be marked as deactivated
        expect(order.Subscription.isActive).to.be.false;
        expect(order.Subscription.deactivatedAt.getTime()).to.be.at.most(new Date().getTime());
        expect(order.status).to.eql(status.CANCELLED);
      });
    });
  });

  describe('#ordersWithPendingCharges @database', () => {
    let user, collective, tier;

    beforeEach(async () => {
      await utils.resetTestDB();
      user = await models.User.createUserWithCollective({ email: randEmail(), name: 'Test McTesterson' });
      collective = await models.Collective.create({ name: 'Parcel' });
      tier = await models.Tier.create({ name: 'backer', amount: 0 });
    });

    it('should filter orders with NULL subscription IDs', async () => {
      // Given an order without a subscription
      await models.Order.create({
        CreatedByUserId: user.id,
        FromCollectiveId: user.CollectiveId,
        CollectiveId: collective.id,
        TierId: tier.id,
        totalAmount: 10000,
        currency: 'USD',
      });

      // When the orders with pending charges are listed
      const output = await ordersWithPendingCharges();

      // Then nothing should be returned
      expect(output.length).to.equal(0);
    });

    it('should return orders with subscription active & due', async () => {
      // Given an order with a subscription
      const payment = { amount: 1000, currency: 'USD', interval: 'month' };
      const subscription = await models.Subscription.create({
        ...payment,
        isActive: true,
        activatedAt: new Date('2018-01-29'),
        nextChargeDate: new Date('2018-01-29'),
      });
      await models.Order.create({
        CreatedByUserId: user.id,
        FromCollectiveId: user.CollectiveId,
        CollectiveId: collective.id,
        TierId: tier.id,
        SubscriptionId: subscription.id,
        totalAmount: payment.amount,
        currency: payment.currency,
        interval: payment.interval,
      });
      // And a one time order
      await models.Order.create({
        CreatedByUserId: user.id,
        FromCollectiveId: user.CollectiveId,
        CollectiveId: collective.id,
        TierId: tier.id,
        totalAmount: 1000,
        currency: 'USD',
      });

      // When the orders with pending charges are listed
      const output = await ordersWithPendingCharges();

      // Then we get just one. The second one doesn't have a
      // subscription id
      expect(output.length).to.equal(1);
    });
  });

  describe('#groupProcessedOrders', () => {
    it('should group orders by their status charged, past due, and canceled', () => {
      // Given three types of
      const data = [
        { orderId: 1, status: 'success', amount: 1000, retriesAfter: 0 },
        { orderId: 2, status: 'success', amount: 1000, retriesAfter: 0 },
        { orderId: 3, status: 'failure', amount: 2000, retriesAfter: 1 },
        {
          orderId: 4,
          status: 'failure',
          amount: 3000,
          retriesAfter: MAX_RETRIES,
        },
      ];

      // When the orders are grouped by their different statuses
      const groupedOrders = groupProcessedOrders(data);

      // Then we see 3 groups in the iterator output
      expect([...groupedOrders.keys()]).to.deep.equal(['charged', 'past_due', 'canceled']);

      // And then we see that transaction OrderId=1 was successfuly charged
      expect(groupedOrders.get('charged').total).to.equal(2000);
      expect(groupedOrders.get('charged').entries.length).to.equal(2);
      expect(groupedOrders.get('charged').entries[0].orderId).to.equal(1);
      expect(groupedOrders.get('charged').entries[1].orderId).to.equal(2);

      // And then we see that transaction OrderId=2 failed charging
      // but it's still under MAX_RETRIES
      expect(groupedOrders.get('past_due').total).to.equal(2000);
      expect(groupedOrders.get('past_due').entries.length).to.equal(1);
      expect(groupedOrders.get('past_due').entries[0].orderId).to.equal(3);

      // And then we see that transaction OrderId=3 failed charging
      // and it reached the maximum number of retries so it got
      // canceled.
      expect(groupedOrders.get('canceled').total).to.equal(3000);
      expect(groupedOrders.get('canceled').entries.length).to.equal(1);
      expect(groupedOrders.get('canceled').entries[0].orderId).to.equal(4);
    });
  });
});

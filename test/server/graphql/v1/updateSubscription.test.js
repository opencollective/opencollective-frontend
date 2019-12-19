import sinon from 'sinon';
import nodemailer from 'nodemailer';
import { expect } from 'chai';
import config from 'config';

import * as utils from '../../../utils';
import models from '../../../../server/models';
import ORDER_STATUS from '../../../../server/constants/order_status';
import initNock from '../../../nocks/graphql.updateSubscription.nock';

const ordersData = utils.data('orders');
const updateSubscriptionQuery = `
mutation updateSubscription($id: Int!, $paymentMethod: PaymentMethodInputType, $amount: Int) {
  updateSubscription(id: $id, paymentMethod: $paymentMethod, amount: $amount) {
    id
    currency
    totalAmount
    interval
    createdAt
    isSubscriptionActive
    collective {
      id
    }
    fromCollective {
      id
      slug
      createdByUser {
        id
      }
    }
    paymentMethod {
      id
      uuid
      data
      name
      expiryDate
    }
  }
}
`;

describe('server/graphql/v1/updateSubscription', () => {
  let collective, user, user2, paymentMethod;

  beforeEach(initNock);

  beforeEach(() => utils.resetTestDB());

  beforeEach(() => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user = u)));

  beforeEach(() => models.User.createUserWithCollective(utils.data('user2')).tap(u => (user2 = u)));

  beforeEach(() => models.Collective.create(utils.data('collective1')).tap(g => (collective = g)));

  beforeEach(() => collective.addHost(user.collective, user));

  // create stripe account
  beforeEach(() => {
    models.ConnectedAccount.create({
      service: 'stripe',
      token: 'sktest_123',
      CollectiveId: user.CollectiveId,
    });
  });

  // Create a paymentMethod.
  beforeEach(() => models.PaymentMethod.create(utils.data('paymentMethod2')).tap(c => (paymentMethod = c)));

  /**
   * Update subscription
   */
  describe('#update', () => {
    const subscription = utils.data('subscription1');
    let order, nm;

    // create a fake nodemailer transport
    beforeEach(() => {
      config.mailgun = config.mailgun || {};
      config.mailgun.user = 'xxxxx';
      config.mailgun.password = 'password';

      nm = nodemailer.createTransport({
        name: 'testsend',
        service: 'Mailgun',
        sendMail(data, callback) {
          callback();
        },
        logger: false,
      });
      sinon.stub(nodemailer, 'createTransport').callsFake(() => nm);
    });

    // stub the transport
    beforeEach(() => sinon.stub(nm, 'sendMail').callsFake((object, cb) => cb(null, object)));

    afterEach(() => nm.sendMail.restore());

    afterEach(() => {
      config.mailgun.user = '';
      config.mailgun.password = '';
      nodemailer.createTransport.restore();
    });

    beforeEach(() => {
      return models.Subscription.create(subscription)
        .then(sub =>
          models.Order.create({
            ...ordersData[0],
            CreatedByUserId: user.id,
            FromCollectiveId: user.CollectiveId,
            CollectiveId: collective.id,
            PaymentMethodId: paymentMethod.id,
            SubscriptionId: sub.id,
            totalAmount: sub.amount,
          }),
        )
        .then(order =>
          models.Order.findOne({
            where: { id: order.id },
            include: [{ model: models.Subscription }],
          }),
        )
        .tap(o => (order = o))
        .catch();
    });

    it('fails if if no authorization provided', async () => {
      const res = await utils.graphqlQuery(updateSubscriptionQuery, {
        id: order.id,
        paymentMethod: {},
      });

      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal('You need to be logged in to update a subscription');
    });

    it('fails if the subscription does not exist', async () => {
      const res = await utils.graphqlQuery(updateSubscriptionQuery, { id: 2 }, user);
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal('Subscription not found');
    });

    it("fails if user isn't an admin of the collective", async () => {
      const res = await utils.graphqlQuery(updateSubscriptionQuery, { id: order.id }, user2);

      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal("You don't have permission to update this subscription");
    });

    it('fails if the subscription is not active', async () => {
      const order2 = await models.Subscription.create(
        Object.assign({}, subscription, {
          isActive: false,
          deactivatedAt: new Date(),
        }),
      ).then(sub =>
        models.Order.create({
          ...ordersData[0],
          CreatedByUserId: user.id,
          FromCollectiveId: user.CollectiveId,
          CollectiveId: collective.id,
          PaymentMethodId: paymentMethod.id,
          SubscriptionId: sub.id,
        }),
      );

      const res = await utils.graphqlQuery(updateSubscriptionQuery, { id: order2.id }, user);

      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal('Subscription must be active to be updated');
    });

    describe('updating payment method', async () => {
      it("fails if the payment method uuid doesn't exist", async () => {
        const res = await utils.graphqlQuery(
          updateSubscriptionQuery,
          {
            id: order.id,
            paymentMethod: { uuid: 'c7279ed2-e825-4494-98b8-12ad1a3b85ff' },
          },
          user,
        );

        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal('Payment method not found with this uuid');
      });

      describe('when the order was not past due', () => {
        it('succeeds when the payment method uuid is valid', async () => {
          const pm2 = await models.PaymentMethod.create(
            Object.assign({}, utils.data('paymentMethod2'), {
              token: 'tok_123456781234567812345612',
              customerId: 'cus_new',
              name: '3434',
            }),
          );

          const originalNextChargeDate = order.Subscription.nextChargeDate.toString();
          const originalNextPeriodStart = order.Subscription.nextPeriodStart.toString();
          const originalChargeRetryCount = order.Subscription.chargeRetryCount;

          const res = await utils.graphqlQuery(
            updateSubscriptionQuery,
            { id: order.id, paymentMethod: { uuid: pm2.uuid } },
            user,
          );

          expect(res.errors).to.not.exist;

          const updatedOrder = await models.Order.findOne({
            where: {
              id: order.id,
            },
            include: [{ model: models.Subscription }],
          });

          expect(updatedOrder.PaymentMethodId).to.equal(pm2.id);
          expect(updatedOrder.Subscription.chargeRetryCount).to.equal(originalChargeRetryCount);
          expect(updatedOrder.Subscription.nextChargeDate.toString()).to.have.string(originalNextChargeDate);
          expect(updatedOrder.Subscription.nextPeriodStart.toString()).to.have.string(originalNextPeriodStart);
        });

        it("succeeds when it's a new payment method", async () => {
          const res = await utils.graphqlQuery(
            updateSubscriptionQuery,
            {
              id: order.id,
              paymentMethod: {
                name: '8431',
                token: 'tok_1BvCA5DjPFcHOcTmg1234567',
                service: 'stripe',
                type: 'creditcard',
                data: {
                  expMonth: 1,
                  expYear: 2019,
                  brand: 'American Express',
                  country: 'US',
                  funding: 'credit',
                  zip: '10012',
                },
              },
            },
            user,
          );

          expect(res.errors).to.not.exist;
          const newPM = await models.PaymentMethod.findOne({
            where: {
              name: '8431',
              token: 'tok_1BvCA5DjPFcHOcTmg1234567',
            },
          });
          const updatedOrder = await models.Order.findByPk(order.id);
          expect(updatedOrder.PaymentMethodId).to.equal(newPM.id);
        });
      });

      describe('when the order was past due', () => {
        let pastDueSubscription, clock;

        beforeEach(async () => {
          pastDueSubscription = await models.Subscription.findByPk(1);
          const nextChargeDate = new Date('2018-01-29');

          pastDueSubscription = await pastDueSubscription.update({
            chargeRetryCount: 1,
            nextChargeDate,
          });
        });

        before(() => (clock = sinon.useFakeTimers(new Date('2018-01-28 0:0').getTime())));

        after(() => clock.restore());

        it('succeeds when the payment method uuid is valid', async () => {
          // add a new payment method
          const pm2 = await models.PaymentMethod.create(
            Object.assign({}, utils.data('paymentMethod2'), {
              token: 'tok_123456781234567812345612',
              customerId: 'cus_new',
              name: '3434',
            }),
          );

          // record original value
          const originalNextPeriodStart = pastDueSubscription.nextPeriodStart;

          // run query
          const res = await utils.graphqlQuery(
            updateSubscriptionQuery,
            { id: order.id, paymentMethod: { uuid: pm2.uuid } },
            user,
          );

          // expect no errors
          expect(res.errors).to.not.exist;

          // fetch updated order
          const updatedOrder = await models.Order.findOne({
            where: {
              id: order.id,
            },
            include: [{ model: models.Subscription }],
          });

          expect(updatedOrder.PaymentMethodId).to.equal(pm2.id);
          expect(updatedOrder.Subscription.chargeRetryCount).to.equal(0);
          expect(updatedOrder.Subscription.nextChargeDate.getTime()).to.equal(new Date('2018-01-28 0:0').getTime());
          expect(updatedOrder.Subscription.nextPeriodStart.getTime()).to.equal(originalNextPeriodStart.getTime());
        });

        it("succeeds when it's a new payment method", async () => {
          // record original value
          const originalNextPeriodStart = pastDueSubscription.nextPeriodStart;

          // run query
          const res = await utils.graphqlQuery(
            updateSubscriptionQuery,
            {
              id: order.id,
              paymentMethod: {
                name: '8431',
                token: 'tok_1BvCA5DjPFcHOcTmg1234567',
                service: 'stripe',
                type: 'creditcard',
                data: {
                  expMonth: 1,
                  expYear: 2019,
                  brand: 'American Express',
                  country: 'US',
                  funding: 'credit',
                  zip: '10012',
                },
              },
            },
            user,
          );

          expect(res.errors).to.not.exist;

          const newPM = await models.PaymentMethod.findOne({
            where: {
              name: '8431',
              token: 'tok_1BvCA5DjPFcHOcTmg1234567',
            },
          });

          // fetch updated order
          const updatedOrder = await models.Order.findOne({
            where: {
              id: order.id,
            },
            include: [{ model: models.Subscription }],
          });

          expect(updatedOrder.PaymentMethodId).to.equal(newPM.id);
          expect(updatedOrder.Subscription.chargeRetryCount).to.equal(0);
          expect(updatedOrder.Subscription.nextChargeDate.getTime()).to.equal(new Date('2018-01-28 0:0').getTime());
          expect(updatedOrder.Subscription.nextPeriodStart.getTime()).to.equal(originalNextPeriodStart.getTime());
        });
      });
    });

    describe('updating amount', async () => {
      it('fails when the amount is the same', async () => {
        const res = await utils.graphqlQuery(updateSubscriptionQuery, { id: order.id, amount: 2000 }, user);

        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal('Same amount');
      });

      it('fails when the amount is invalid (too small)', async () => {
        const res = await utils.graphqlQuery(updateSubscriptionQuery, { id: order.id, amount: 75 }, user);

        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal('Invalid amount');
      });

      it('fails when the amount is invalid (divisible by 100)', async () => {
        const res = await utils.graphqlQuery(updateSubscriptionQuery, { id: order.id, amount: 125 }, user);

        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal('Invalid amount');
      });

      it('succeeds when the amount is valid', async () => {
        const res = await utils.graphqlQuery(updateSubscriptionQuery, { id: order.id, amount: 4000 }, user);

        expect(res.errors).to.not.exist;

        const activeOrders = await models.Order.findAll({
          where: {
            CreatedByUserId: order.CreatedByUserId,
            CollectiveId: order.CollectiveId,
          },
          include: [
            {
              model: models.Subscription,
              where: {
                isActive: true,
              },
            },
          ],
        });
        const updatedOrder = await models.Order.findByPk(order.id);
        const activeOrder = activeOrders && activeOrders[0];

        expect(updatedOrder.totalAmount).to.equal(order.totalAmount);
        expect(updatedOrder.status).to.equal(ORDER_STATUS.CANCELLED);
        expect(activeOrder.totalAmount).to.equal(4000);
        expect(activeOrder.status).to.equal(ORDER_STATUS.ACTIVE);
        expect(activeOrder.Subscription.amount).to.equal(4000);
      });
    });
  });
});
